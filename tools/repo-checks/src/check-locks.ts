import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The lock check (Build rules H6). For a PR from t/<B|F><n>-<slug> it reads the ticket's rendered
// build task doc (its Territory) and its locks.md line, then holds the builder's commits to them.
// The builder's commits are the commits after the lock line's sha.

const root = process.env.AVEL_REPO_ROOT ?? fileURLToPath(new URL("../../../", import.meta.url));
const branch = process.env.GITHUB_HEAD_REF ?? "";

function run(cmd: string, args: string[]): { status: number | null; out: string } {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function git(...args: string[]): string {
  const r = run("git", args);
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.out.trim()}`);
  return r.out;
}

// The same reading of a glob as render.py's glob_regex.
function globRegex(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob.charAt(i);
    if (glob.startsWith("**/", i)) {
      out += "(?:.*/)?";
      i += 2;
    } else if (glob.startsWith("**", i)) {
      out += ".*";
      i += 1;
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else if (c === "{") {
      const end = glob.indexOf("}", i);
      const parts = glob.slice(i + 1, end).split(",");
      out += `(?:${parts.map(escapeLiteral).join("|")})`;
      i = end;
    } else out += escapeLiteral(c);
  }
  return new RegExp(`^${out}$`);
}

function escapeLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

function matchesAny(globs: string[], path: string): boolean {
  return globs.some((g) => globRegex(g).test(path));
}

function fail(problems: string[]): never {
  console.error("lock check failed:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

function findBuildDoc(ticketLower: string): string | undefined {
  const base = join(root, "docs/agent-dispatch");
  for (const lane of readdirSync(base, { withFileTypes: true })) {
    if (!lane.isDirectory()) continue;
    for (const sprint of readdirSync(join(base, lane.name), { withFileTypes: true })) {
      if (!sprint.isDirectory()) continue;
      const dir = join(base, lane.name, sprint.name);
      const doc = readdirSync(dir).find((f) =>
        new RegExp(`^agent-[a-z]+-${ticketLower}-build\\.md$`).test(f),
      );
      if (doc) return `docs/agent-dispatch/${lane.name}/${sprint.name}/${doc}`;
    }
  }
  return undefined;
}

// The "You may change" list of the doc's Part 5.
function territory(doc: string): string[] {
  const lines = readFileSync(join(root, doc), "utf8").split("\n");
  const start = lines.findIndex((l) => l.startsWith("**You may change**"));
  if (start < 0) return [];
  const globs: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("**")) break;
    const m = /^- `([^`]+)`/.exec(line);
    if (m?.[1]) globs.push(m[1]);
  }
  return globs;
}

function lockLines(text: string): string[] {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- T-"));
}

// The ticket's line as it was in the commit that first added it.
function firstLine(
  locksPath: string,
  ticket: string,
): { paths: string[]; sha: string } | undefined {
  const commits = git("log", "--reverse", "--format=%H", "--", locksPath)
    .split("\n")
    .filter(Boolean);
  for (const c of commits) {
    const r = run("git", ["show", `${c}:${locksPath}`]);
    if (r.status !== 0) continue;
    const line = lockLines(r.out).find((l) => l.startsWith(`- ${ticket}:`));
    const m = line && /^- T-\w+:\s*(.+?)\s*@\s*([0-9a-f]{7,40})$/.exec(line);
    if (m?.[1] && m[2]) {
      return { paths: m[1].split(",").map((p) => p.trim()), sha: m[2] };
    }
  }
  return undefined;
}

function main(): void {
  const m = /^t\/([BF]\d+)-/.exec(branch);
  if (!branch.startsWith("t/")) {
    console.log(`lock check passed: branch "${branch}" is not a ticket PR`);
    return;
  }
  if (!m?.[1]) fail([`branch "${branch}" isn't named t/<B|F><n>-<slug>`]);
  const ticket = `T-${m[1]}`;

  const doc = findBuildDoc(ticket.toLowerCase());
  if (!doc) fail([`no rendered build task doc for ${ticket}`]);
  const sprintDir = dirname(doc);
  const locksPath = `${sprintDir}/locks.md`;
  const lock = existsSync(join(root, locksPath)) ? firstLine(locksPath, ticket) : undefined;
  if (!lock) fail([`no ${ticket} line in ${locksPath}`]);

  const problems: string[] = [];
  const allowed = territory(doc);
  const [, lane = "", sprint = ""] = /^docs\/agent-dispatch\/([^/]+)\/([^/]+)\//.exec(doc) ?? [];

  const verify = run("python3", ["scripts/render.py", "--verify", `${lane}/${sprint}`]);
  if (verify.status !== 0)
    problems.push(`render.py --verify ${lane}/${sprint} failed:\n${verify.out.trim()}`);

  if (run("git", ["cat-file", "-e", `${lock.sha}^{commit}`]).status !== 0) {
    fail([...problems, `lock sha ${lock.sha} for ${ticket} isn't in the history (fetch-depth 0?)`]);
  }
  const commits = git("rev-list", "--reverse", "--no-merges", `${lock.sha}..HEAD`)
    .split("\n")
    .filter(Boolean);
  for (const c of commits) {
    const files = git("diff-tree", "--no-commit-id", "--name-only", "-r", "--root", c)
      .split("\n")
      .filter(Boolean);
    if (files.length === 1 && files[0] === locksPath) {
      const before = lockLines(run("git", ["show", `${c}^:${locksPath}`]).out);
      const after = new Set(lockLines(git("show", `${c}:${locksPath}`)));
      if (before.some((l) => !after.has(l))) {
        problems.push(`${locksPath}: commit ${c.slice(0, 7)} rewrites or drops a lock line`);
      }
      continue;
    }
    for (const f of files) {
      if (matchesAny(lock.paths, f))
        problems.push(`${f}: locked by ${ticket} (commit ${c.slice(0, 7)})`);
      else if (!matchesAny(allowed, f))
        problems.push(`${f}: outside the Territory of ${doc} (commit ${c.slice(0, 7)})`);
    }
  }
  if (problems.length > 0) fail(problems);
  console.log(`lock check passed: ${ticket}, ${commits.length} builder commit(s)`);
}

main();

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The lock check (Build rules H6). For a PR from t/<B|F><n>-<slug> it reads the ticket's rendered
// build task doc (its Territory) and its locks.md line, then holds the builder's commits to them.
// The builder's commits are every commit after the lock line's sha that isn't on the base branch,
// side branches included. The tests report (the checker's, rewritten by the kit) is exempt, and so is
// one added line in the builder's own memory file, .agents/memory/<builder>.md (CR-46 B4).

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

// The build doc whose front matter `branch:` is the PR's branch.
function findBuildDoc(ticketLower: string): string | undefined {
  const base = join(root, "docs/agent-dispatch");
  const name = new RegExp(`^agent-[a-z]+-${ticketLower}-build\\.md$`);
  for (const lane of readdirSync(base, { withFileTypes: true })) {
    if (!lane.isDirectory()) continue;
    for (const sprint of readdirSync(join(base, lane.name), { withFileTypes: true })) {
      if (!sprint.isDirectory()) continue;
      const dir = join(base, lane.name, sprint.name);
      for (const f of readdirSync(dir)) {
        if (!name.test(f)) continue;
        const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, f), "utf8"))?.[1] ?? "";
        if (front.split("\n").some((l) => l.trim() === `branch: ${branch}`)) {
          return `docs/agent-dispatch/${lane.name}/${sprint.name}/${f}`;
        }
      }
    }
  }
  return undefined;
}

function frontMatter(path: string): string {
  return /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(root, path), "utf8"))?.[1] ?? "";
}

// The tests report: the `report:` of the tests task doc that the build doc's `after:` names.
function testsReport(doc: string): string | undefined {
  const after = /^after:\s*\[(.*)\]\s*$/m.exec(frontMatter(doc))?.[1] ?? "";
  for (const name of after.split(",").map((n) => n.trim())) {
    const path = `${dirname(doc)}/${name}.md`;
    if (!name || !existsSync(join(root, path))) continue;
    const front = frontMatter(path);
    if (!/^kind:\s*tests\s*$/m.test(front)) continue;
    const report = /^report:\s*(\S+)\s*$/m.exec(front)?.[1];
    if (report) return report;
  }
  return undefined;
}

// The base branch the PR targets: origin/$GITHUB_BASE_REF, else a local main (scratch repos).
function baseRef(): string | undefined {
  const wanted = process.env.GITHUB_BASE_REF;
  const candidates = [...(wanted ? [`origin/${wanted}`] : []), "main"];
  return candidates.find(
    (c) => run("git", ["rev-parse", "--verify", "-q", `${c}^{commit}`]).status === 0,
  );
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
): { paths: string[]; sha: string; line: string } | undefined {
  const commits = git("log", "--reverse", "--format=%H", "--", locksPath)
    .split("\n")
    .filter(Boolean);
  for (const c of commits) {
    const r = run("git", ["show", `${c}:${locksPath}`]);
    if (r.status !== 0) continue;
    const line = lockLines(r.out).find((l) => l.startsWith(`- ${ticket}:`));
    const m = line && /^- T-\w+:\s*(.+?)\s*@\s*([0-9a-f]{7,40})$/.exec(line);
    if (line && m?.[1] && m[2]) {
      return { paths: m[1].split(",").map((p) => p.trim()), sha: m[2], line };
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
  const report = testsReport(doc);
  const [, lane = "", sprint = ""] = /^docs\/agent-dispatch\/([^/]+)\/([^/]+)\//.exec(doc) ?? [];

  const verify = run("python3", ["scripts/render.py", "--verify", `${lane}/${sprint}`]);
  if (verify.status !== 0)
    problems.push(`render.py --verify ${lane}/${sprint} failed:\n${verify.out.trim()}`);

  if (run("git", ["cat-file", "-e", `${lock.sha}^{commit}`]).status !== 0) {
    fail([...problems, `lock sha ${lock.sha} for ${ticket} isn't in the history (fetch-depth 0?)`]);
  }
  const base = baseRef();
  if (!base) {
    fail([
      ...problems,
      `no base branch to compare against (origin/${process.env.GITHUB_BASE_REF ?? "<base>"} or main): fetch-depth 0?`,
    ]);
  }
  // Every commit after the lock that isn't on the base branch, side branches included. A merge is
  // held to what its result changed against every parent (an "evil merge"); what a merge brings in
  // from main is main's own and isn't in the range.
  const commits = git("rev-list", "--reverse", "--topo-order", `${lock.sha}..HEAD`, `^${base}`)
    .split("\n")
    .filter(Boolean);
  const filesOf = (c: string): string[] =>
    git("diff-tree", "-c", "--no-commit-id", "--name-only", "-r", "--root", c)
      .split("\n")
      .filter(Boolean);
  const isAncestor = (a: string, b: string): boolean =>
    run("git", ["merge-base", "--is-ancestor", a, b]).status === 0;
  const resolve = (sha: string): string | undefined => {
    const r = run("git", ["rev-parse", "--verify", "-q", `${sha}^{commit}`]);
    return r.status === 0 ? r.out.trim() : undefined;
  };

  // Locks in force: the first line, then each honoured F2 relock line (Build rules F2).
  const locks = [{ paths: lock.paths, sha: lock.sha }];
  const relocks: string[] = [];
  const ownLine = `- ${ticket}:`;
  const relockRe = /^- T-\w+:\s*(.+?)\s*@\s*([0-9a-f]{7,40})\s*\(F2 relock\)$/;
  for (const c of commits) {
    const files = filesOf(c);
    if (files.length !== 1 || files[0] !== locksPath) continue;
    const before = lockLines(run("git", ["show", `${c}^:${locksPath}`]).out);
    const after = lockLines(git("show", `${c}:${locksPath}`));
    if (before.some((l) => !after.includes(l))) {
      problems.push(`${locksPath}: commit ${c.slice(0, 7)} rewrites or drops a lock line`);
      continue;
    }
    for (const l of after) {
      if (before.includes(l) || l === lock.line || !l.startsWith(ownLine)) continue;
      const m = relockRe.exec(l);
      const sha = m?.[2] && resolve(m[2]);
      const paths = m?.[1]?.split(",").map((p) => p.trim()) ?? [];
      const last = locks[locks.length - 1] ?? locks[0];
      const ok =
        sha &&
        last &&
        lock.paths.every((p) => paths.includes(p)) &&
        isAncestor(last.sha, sha) &&
        isAncestor(sha, "HEAD");
      if (!ok || !sha) {
        problems.push(
          `${locksPath}: commit ${c.slice(0, 7)} adds a line for ${ticket} that isn't a valid F2 relock`,
        );
        continue;
      }
      locks.push({ paths, sha });
      relocks.push(sha);
    }
  }

  // CR-46 B4: the builder may add one lesson to its own memory file. Held across the whole range: at
  // most one line added, none removed. Anyone else's memory file is outside the Territory as usual.
  const builder = /\/agent-([a-z0-9]+)-[^/]*-build\.md$/.exec(doc)?.[1] ?? "";
  const memory = `.agents/memory/${builder}.md`;
  if (builder && commits.some((c) => filesOf(c).includes(memory))) {
    // From where the branch meets the base, so what a merge of main brings in doesn't count.
    const [added = "0", removed = "0"] = git("diff", "--numstat", `${base}...HEAD`, "--", memory)
      .trim()
      .split(/\s+/);
    if (Number(added) > 1 || Number(removed) > 0)
      problems.push(
        `${memory}: a ticket may add one line to its builder's memory file; this adds ${added} and removes ${removed} (CR-46 B4)`,
      );
  }

  for (const c of commits) {
    const files = filesOf(c).filter((f) => f !== report && f !== memory);
    if (files.length === 1 && files[0] === locksPath) continue;
    // The checker's fix before a relock is allowed; the Territory still applies.
    const frozen = !relocks.some((r) => isAncestor(c, r));
    const inForce = [...locks].reverse().find((l) => l.sha !== c && isAncestor(l.sha, c));
    // A checker's F2 fix (a commit before a relock) may add test files: the relock that follows it locks them.
    const covering = locks.slice(1).find((l) => isAncestor(c, l.sha));
    for (const f of files) {
      if (inForce && matchesAny(inForce.paths, f)) {
        if (frozen) problems.push(`${f}: locked by ${ticket} (commit ${c.slice(0, 7)})`);
      } else if (!frozen && covering && matchesAny(covering.paths, f)) {
        // the checker's F2 fix, locked by the relock that follows it
      } else if (!matchesAny(allowed, f))
        problems.push(`${f}: outside the Territory of ${doc} (commit ${c.slice(0, 7)})`);
    }
  }
  if (problems.length > 0) fail(problems);
  console.log(`lock check passed: ${ticket}, ${commits.length} builder commit(s)`);
}

main();

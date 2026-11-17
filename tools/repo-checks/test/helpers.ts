import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Black-box helpers for the @avel/repo-checks tests (T-B0). The lock check is run the way
// .github/workflows/locks.yml runs it (`pnpm --filter @avel/repo-checks run check-locks`), so a
// test fails on an assertion about what the check said, never on an import error.
//
// The interface these tests lock (Soap builds to it):
//   script  `check-locks` in tools/repo-checks/package.json.
//   env     AVEL_REPO_ROOT  the git checkout to check (default: the repo root).
//           GITHUB_HEAD_REF the PR's head branch name. A pull_request run is a detached merge
//                           commit, so the check never reads the branch from git.
//   passes  exit 0, and the output says "lock check passed". A branch not named t/* passes
//           with a note that says "not a ticket PR".
//   fails   exit 1, and the output names each offending file (repo-relative path). A ticket
//           with no rendered build task doc, or no locks.md line, fails and the output names
//           the ticket (T-B9), and says "locks.md" when it's the line that is missing.
//   range   the builder's commits are `<lock sha>..HEAD`. A commit that changes only the sprint's
//           locks.md is the lead's lock commit, not the builder's, and is not held to the Territory,
//           but only if it adds lines and leaves every existing lock line unchanged. The ticket's
//           line is read from the commit that first added it, never from a later edit. A commit
//           that rewrites or drops a lock line fails, and the output names locks.md.
//   globs   the Territory is the build task doc's "You may change" list, read as render.py's
//           glob_regex reads it. The doc's own report path is in that list.
//   locks   the locks.md line is `- T-B2: <path or glob>, <path or glob> @ <sha>`. A line inside
//           an HTML comment (the template's example) is not a lock.
//   verify  it also runs `python3 scripts/render.py --verify <lane>/<sprint>` in AVEL_REPO_ROOT.
//
// pnpm exits 0 when --filter matches no package, so a test never treats exit 0 alone as success.

export const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
export const SPRINT = "backend/sprint-01";
export const SPRINT_DIR = `docs/agent-dispatch/${SPRINT}`;
export const BRANCH = "t/B2-server-shell";
// T-B2 in docs/agent-dispatch/avel/example-plan.toml
export const TERRITORY_FILE = "packages/server/src/http/app.ts";
export const REPORT = `${SPRINT_DIR}/agent-soap-t-b2-build-completion.md`;
export const LOCKED_TEST = "packages/server/test/shell.test.ts";

export type RunResult = { status: number | null; output: string };

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = {}): RunResult {
  const r = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 100_000,
  });
  return { status: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

export function git(dir: string, ...args: string[]): string {
  const r = sh(dir, "git", [
    "-c",
    "user.email=rigg@example.test",
    "-c",
    "user.name=Rigg Fixture",
    "-c",
    "commit.gpgsign=false",
    ...args,
  ]);
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.output}`);
  return r.output.trim();
}

export function write(dir: string, path: string, body: string): void {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
}

// Commit the given files (path -> body) and return the new commit's sha.
export function commit(dir: string, message: string, files: Record<string, string>): string {
  for (const [path, body] of Object.entries(files)) write(dir, path, body);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", message);
  return git(dir, "rev-parse", "HEAD");
}

// A scratch repo: render.py, the roster and the example plan, rendered and committed on main.
export function baseRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "avel-locks-"));
  git(dir, "init", "-q", "-b", "main");
  mkdirSync(join(dir, "scripts/agents"), { recursive: true });
  mkdirSync(join(dir, SPRINT_DIR), { recursive: true });
  copyFileSync(join(repoRoot, "scripts/render.py"), join(dir, "scripts/render.py"));
  copyFileSync(
    join(repoRoot, "scripts/agents/roster.json"),
    join(dir, "scripts/agents/roster.json"),
  );
  copyFileSync(
    join(repoRoot, "docs/agent-dispatch/avel/example-plan.toml"),
    join(dir, SPRINT_DIR, "plan.toml"),
  );
  const rendered = sh(dir, "python3", ["scripts/render.py", SPRINT]);
  if (rendered.status !== 0) throw new Error(`render.py failed: ${rendered.output}`);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base: rendered sprint");
  return dir;
}

export type Fixture = { dir: string; lockSha: string };

// The usual shape of a ticket branch: the checker's tests (the lock sha), then the lead's lock
// commit (locks.md only). `extraLocked` adds locked paths to the line. The branch is left checked
// out detached, as a pull_request run leaves it.
export function ticketRepo(
  opts: { branch?: string; locksLine?: boolean; extraLocked?: string[]; testFiles?: string[] } = {},
): Fixture {
  const dir = baseRepo();
  git(dir, "checkout", "-q", "-b", opts.branch ?? BRANCH);
  const testFiles = opts.testFiles ?? [LOCKED_TEST];
  const lockSha = commit(
    dir,
    "tests",
    Object.fromEntries(testFiles.map((p) => [p, "// the checker's test\n"])),
  );
  if (opts.locksLine !== false) {
    const paths = [LOCKED_TEST, ...(opts.extraLocked ?? [])].join(", ");
    const locks = readFileSync(join(dir, SPRINT_DIR, "locks.md"), "utf8");
    commit(dir, "lock T-B2", {
      [`${SPRINT_DIR}/locks.md`]: `${locks}\n- T-B2: ${paths} @ ${lockSha}\n`,
    });
  }
  git(dir, "checkout", "-q", "--detach");
  return { dir, lockSha };
}

// A builder commit on the fixture's detached head.
export function builderCommit(dir: string, files: string[]): void {
  commit(dir, "build", Object.fromEntries(files.map((p) => [p, "// the builder's change\n"])));
}

export function runLocks(dir: string, branch: string): RunResult {
  return sh(repoRoot, "pnpm", ["--filter", "@avel/repo-checks", "run", "check-locks"], {
    AVEL_REPO_ROOT: dir,
    GITHUB_HEAD_REF: branch,
  });
}

export function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

// A commit that changes only the sprint's locks.md, on the fixture's detached head.
export function editLocks(dir: string, edit: (text: string) => string): void {
  const path = `${SPRINT_DIR}/locks.md`;
  commit(dir, "edit locks.md", { [path]: edit(readFileSync(join(dir, path), "utf8")) });
}

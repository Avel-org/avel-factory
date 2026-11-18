import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  BRANCH,
  baseRepo,
  builderCommit,
  commit,
  editLocks,
  git,
  LOCKED_TEST,
  REPORT,
  runLocks,
  SPRINT_DIR,
  TERRITORY_FILE,
  ticketRepo,
} from "./helpers.ts";

// T-B5: the lock check holds merge commits to the same rules as any builder commit, finds the build
// doc by the PR's branch, and honours an F2 relock line. The T-B0 interface in helpers.ts is kept:
// same script, environment and messages.

const LONG = 240_000;
const OUTSIDE = "packages/db/src/schema.ts"; // outside T-B2's Territory
const LOCKS = `${SPRINT_DIR}/locks.md`;
const GUARDED = "packages/server/src/http/guarded.ts"; // inside the Territory

const head = (dir: string): string => git(dir, "rev-parse", "HEAD");
const short = (sha: string): string => sha.slice(0, 7);

// A merge of a side branch into the ticket branch, whose result also changes `slipped`, a file
// neither parent changed (an "evil merge"). Both parents' own commits are inside the Territory.
function evilMerge(dir: string, slipped: string): void {
  const fork = head(dir);
  git(dir, "checkout", "-q", "-b", "side");
  commit(dir, "side work", { "packages/server/src/main.ts": "// side work\n" });
  git(dir, "checkout", "-q", "--detach", fork);
  builderCommit(dir, [TERRITORY_FILE]);
  git(dir, "merge", "--no-ff", "--no-commit", "side");
  commit(dir, "merge side", { [slipped]: "// slipped in by the merge\n" });
}

// The checker's fix to the locked test, in its own commit. Returns the new tip's sha.
function checkerFix(dir: string): string {
  return commit(dir, "checker: fix the disputed test", {
    [LOCKED_TEST]: "// the checker's fixed test\n",
  });
}

// The lead's relock: a commit that changes only locks.md, adding a second line for T-B2.
function relock(dir: string, paths: string[], sha: string): void {
  editLocks(dir, (t) => `${t}- T-B2: ${paths.join(", ")} @ ${sha} (F2 relock)\n`);
}

describe("lock check: merges, the build doc by branch, F2 relock (T-B5)", () => {
  test(
    "a merge commit whose result changes a locked test that neither parent changed fails, and names the file",
    () => {
      const { dir } = ticketRepo();
      evilMerge(dir, LOCKED_TEST);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(LOCKED_TEST);
      expect(r.output).not.toContain("lock check passed");
    },
    LONG,
  );

  test(
    "a merge commit whose result changes a file outside the Territory that neither parent changed fails, and names the file",
    () => {
      const { dir } = ticketRepo();
      evilMerge(dir, OUTSIDE);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(OUTSIDE);
      expect(r.output).not.toContain("lock check passed");
    },
    LONG,
  );

  test(
    "a merge of main into the ticket branch that only brings in main's own commits passes",
    () => {
      const { dir } = ticketRepo();
      const tip = head(dir);
      // main moves on, touching files the ticket's Territory doesn't cover
      git(dir, "checkout", "-q", "main");
      commit(dir, "main: schema change", { [OUTSIDE]: "// main's own change\n" });
      commit(dir, "main: docs", { "docs/design/notes.md": "# main's own note\n" });
      git(dir, "checkout", "-q", "--detach", tip);
      builderCommit(dir, [TERRITORY_FILE]);
      git(dir, "merge", "--no-ff", "-m", "merge main into the ticket branch", "main");
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "the build doc is the one whose branch: front matter matches GITHUB_HEAD_REF, even when another sprint's folder has a doc with the same file name",
    () => {
      // A decoy with the real doc's file name in a sprint folder that sorts first, under a different
      // branch. It has no locks.md: the first file with the ticket's name is the wrong doc.
      const dir = baseRepo();
      const name = "agent-soap-t-b2-build.md";
      const realDoc = readFileSync(join(dir, SPRINT_DIR, name), "utf8");
      expect(realDoc).toContain(`branch: ${BRANCH}`);
      const decoy = realDoc.replace(`branch: ${BRANCH}`, "branch: t/B2-some-other-ticket");
      expect(decoy).not.toBe(realDoc);
      git(dir, "checkout", "-q", "-b", BRANCH);
      commit(dir, "earlier sprint", { [`docs/agent-dispatch/backend/sprint-00/${name}`]: decoy });
      const lockSha = commit(dir, "tests", { [LOCKED_TEST]: "// the checker's test\n" });
      const locks = readFileSync(join(dir, LOCKS), "utf8");
      commit(dir, "lock T-B2", { [LOCKS]: `${locks}\n- T-B2: ${LOCKED_TEST} @ ${lockSha}\n` });
      builderCommit(dir, [TERRITORY_FILE]);
      git(dir, "checkout", "-q", "--detach");
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "F2 relock: a checker's commit changing a locked test, then a locks.md-only relock line at the new tip with the same paths, then a builder commit inside the Territory, passes",
    () => {
      const { dir } = ticketRepo();
      const fixed = checkerFix(dir);
      relock(dir, [LOCKED_TEST], fixed);
      builderCommit(dir, [TERRITORY_FILE, "packages/server/src/main.ts", REPORT]);
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);

      // a relock that lists more paths than the first line is honoured too
      const more = ticketRepo();
      const fixed2 = checkerFix(more.dir);
      relock(more.dir, [LOCKED_TEST, GUARDED], fixed2);
      builderCommit(more.dir, [TERRITORY_FILE]);
      const r2 = runLocks(more.dir, BRANCH);
      expect(r2.output).toContain("lock check passed");
      expect(r2.status).toBe(0);
    },
    LONG,
  );

  test(
    "F2 relock: a builder commit that changes a locked test after the relock still fails and names the file, and one outside the Territory before the relock still fails",
    () => {
      // after the relock: only the builder's commit is named, never the checker's fix before it
      const after = ticketRepo();
      const fixed = checkerFix(after.dir);
      relock(after.dir, [LOCKED_TEST], fixed);
      builderCommit(after.dir, [LOCKED_TEST]);
      const builderSha = head(after.dir);
      const r1 = runLocks(after.dir, BRANCH);
      expect(r1.status).toBe(1);
      expect(r1.output).toContain(LOCKED_TEST);
      expect(r1.output).toContain(short(builderSha));
      expect(r1.output).not.toContain(short(fixed));

      // before the relock: the Territory still holds every commit after the first lock sha, and the
      // checker's fix to the locked test isn't what's named
      const before = ticketRepo();
      builderCommit(before.dir, [OUTSIDE]);
      const fixed2 = checkerFix(before.dir);
      relock(before.dir, [LOCKED_TEST], fixed2);
      builderCommit(before.dir, [TERRITORY_FILE]);
      const r2 = runLocks(before.dir, BRANCH);
      expect(r2.status).toBe(1);
      expect(r2.output).toContain(OUTSIDE);
      expect(r2.output).not.toContain(LOCKED_TEST);
    },
    LONG,
  );

  test(
    "F2 relock: a line with fewer paths, one whose sha isn't a descendant of the first lock, or one added in a commit that also changes another file fails and names locks.md",
    () => {
      // fewer paths: the first line locks two paths, the relock only one
      const fewer = ticketRepo({ extraLocked: [GUARDED] });
      const fixedA = checkerFix(fewer.dir);
      relock(fewer.dir, [LOCKED_TEST], fixedA);
      builderCommit(fewer.dir, [TERRITORY_FILE]);
      const r1 = runLocks(fewer.dir, BRANCH);
      expect(r1.status).toBe(1);
      expect(r1.output).toContain("locks.md");

      // a sha that isn't a descendant of the first lock: a sibling commit off the base
      const sibling = ticketRepo();
      const tip = head(sibling.dir);
      checkerFix(sibling.dir);
      const fixedB = head(sibling.dir);
      git(sibling.dir, "checkout", "-q", "-b", "sibling", "main");
      const stray = commit(sibling.dir, "sibling", { "README-sibling.md": "# sibling\n" });
      git(sibling.dir, "checkout", "-q", "--detach", fixedB);
      expect(tip).not.toBe(fixedB);
      relock(sibling.dir, [LOCKED_TEST], stray);
      builderCommit(sibling.dir, [TERRITORY_FILE]);
      const r2 = runLocks(sibling.dir, BRANCH);
      expect(r2.status).toBe(1);
      expect(r2.output).toContain("locks.md");

      // added in a commit that also changes another file
      const mixed = ticketRepo();
      const fixedC = checkerFix(mixed.dir);
      const path = join(mixed.dir, LOCKS);
      const text = readFileSync(path, "utf8");
      writeFileSync(path, `${text}- T-B2: ${LOCKED_TEST} @ ${fixedC} (F2 relock)\n`);
      commit(mixed.dir, "relock and a build change", {
        [TERRITORY_FILE]: "// the builder's change\n",
      });
      const r3 = runLocks(mixed.dir, BRANCH);
      expect(r3.status).toBe(1);
      expect(r3.output).toContain("locks.md");
      expect(r3.output).toContain(LOCKED_TEST); // the relock isn't honoured, so the checker's fix is named
    },
    LONG,
  );
});

import { describe, expect, test } from "vitest";
import {
  BRANCH,
  builderCommit,
  commit,
  editLocks,
  git,
  LOCKED_TEST,
  runLocks,
  SPRINT_DIR,
  TERRITORY_FILE,
  ticketRepo,
} from "./helpers.ts";

// T-B7: the lock check lets the tests report (the build doc's `after:` names the tests doc, whose
// `report:` is this path) change after the lock, and checks the commits of a merged side branch.
// The T-B0 interface in helpers.ts and T-B5's rules for the relock line itself are unchanged.

const LONG = 240_000;
const OUTSIDE = "packages/db/src/schema.ts"; // outside T-B2's Territory
const TESTS_REPORT = `${SPRINT_DIR}/agent-rigg-t-b2-test-unit-completion.md`;
const REVIEW_REPORT = `${SPRINT_DIR}/agent-rigg-t-b2-review-completion.md`;
const OTHER_TESTS_REPORT = `${SPRINT_DIR}/agent-rigg-t-b3-test-unit-completion.md`;

const head = (dir: string): string => git(dir, "rev-parse", "HEAD");
const short = (sha: string): string => sha.slice(0, 7);

// The checker's fix to the locked test, with its report, in one commit. Returns the new tip's sha.
function checkerFix(dir: string, extra: Record<string, string> = {}): string {
  return commit(dir, "checker: fix the disputed test", {
    [LOCKED_TEST]: "// the checker's fixed test\n",
    [TESTS_REPORT]: "status: test-dispute\nticket: T-B2\n",
    ...extra,
  });
}

// The lead's relock: a commit that changes only locks.md, adding a second line for T-B2.
function relock(dir: string, sha: string): void {
  editLocks(dir, (t) => `${t}- T-B2: ${LOCKED_TEST} @ ${sha} (F2 relock)\n`);
}

// The kit rewrites the tests report to status done after the lock: a commit of that file alone.
function reportDone(dir: string): void {
  commit(dir, "kit: tests report done", { [TESTS_REPORT]: "status: done\nticket: T-B2\n" });
}

describe("lock check: the tests report after the lock, side branches (T-B7)", () => {
  test(
    "a T-F7-shaped history passes: lock, a builder commit, a checker commit changing the locked test and the tests report, a locks.md-only relock at that sha, a report-only commit, then builder commits inside the Territory",
    () => {
      const { dir } = ticketRepo();
      builderCommit(dir, [TERRITORY_FILE]);
      const fixed = checkerFix(dir);
      relock(dir, fixed);
      reportDone(dir);
      builderCommit(dir, ["packages/server/src/main.ts"]);
      builderCommit(dir, ["packages/server/src/http/routes.ts"]);
      const r = runLocks(dir, BRANCH);
      expect(r.output).not.toContain(TESTS_REPORT);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "a commit after the lock that changes only the tests report passes, with or without a relock",
    () => {
      const without = ticketRepo();
      reportDone(without.dir);
      builderCommit(without.dir, [TERRITORY_FILE]);
      const r1 = runLocks(without.dir, BRANCH);
      expect(r1.output).not.toContain(TESTS_REPORT);
      expect(r1.output).toContain("lock check passed");
      expect(r1.status).toBe(0);

      const withRelock = ticketRepo();
      const fixed = checkerFix(withRelock.dir);
      relock(withRelock.dir, fixed);
      reportDone(withRelock.dir);
      const r2 = runLocks(withRelock.dir, BRANCH);
      expect(r2.output).not.toContain(TESTS_REPORT);
      expect(r2.output).toContain("lock check passed");
      expect(r2.status).toBe(0);
    },
    LONG,
  );

  test(
    "a checker commit before the relock that changes the locked test and a file that is neither locked nor the tests report fails, and names that file",
    () => {
      const { dir } = ticketRepo();
      const fixed = checkerFix(dir, { [OUTSIDE]: "// not the checker's to change\n" });
      relock(dir, fixed);
      builderCommit(dir, [TERRITORY_FILE]);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(OUTSIDE);
      expect(r.output).toContain(short(fixed));
      // the checker's fix to the locked test and the tests report are what the relock allows
      expect(r.output).not.toContain(LOCKED_TEST);
      expect(r.output).not.toContain(TESTS_REPORT);
      expect(r.output).not.toContain("lock check passed");
    },
    LONG,
  );

  test(
    "a builder commit that changes another report (the review report, or another ticket's tests report) still fails and names it",
    () => {
      for (const other of [REVIEW_REPORT, OTHER_TESTS_REPORT]) {
        const { dir } = ticketRepo();
        // the same commit also changes the tests report, which is the one path that is exempt
        commit(dir, "build", {
          [TERRITORY_FILE]: "// the builder's change\n",
          [TESTS_REPORT]: "status: done\nticket: T-B2\n",
          [other]: "status: done\n",
        });
        const sha = head(dir);
        const r = runLocks(dir, BRANCH);
        expect(r.status).toBe(1);
        expect(r.output).toContain(other);
        expect(r.output).toContain(short(sha));
        expect(r.output).not.toContain(TESTS_REPORT);
        expect(r.output).not.toContain("lock check passed");
      }
    },
    LONG,
  );

  test(
    "a builder commit that changes a locked test after the relock still fails and names the file, even when the same commit also changes the tests report",
    () => {
      const { dir } = ticketRepo();
      const fixed = checkerFix(dir);
      relock(dir, fixed);
      commit(dir, "build", {
        [LOCKED_TEST]: "// the builder's edit of a locked test\n",
        [TESTS_REPORT]: "status: done\nticket: T-B2\n",
      });
      const builderSha = head(dir);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(LOCKED_TEST);
      expect(r.output).toContain(short(builderSha));
      expect(r.output).not.toContain(short(fixed));
      expect(r.output).not.toContain(TESTS_REPORT);
      expect(r.output).not.toContain("lock check passed");
    },
    LONG,
  );

  test(
    "a side branch whose own commit changes a file outside the Territory, merged cleanly into the ticket branch, fails and names the file and that commit; a merge of main that brings in main's own commits still passes",
    () => {
      const { dir } = ticketRepo();
      const fork = head(dir);
      git(dir, "checkout", "-q", "-b", "side");
      const sideSha = commit(dir, "side work", { [OUTSIDE]: "// slipped in on a side branch\n" });
      git(dir, "checkout", "-q", "--detach", fork);
      builderCommit(dir, [TERRITORY_FILE]);
      git(dir, "merge", "--no-ff", "-m", "merge side", "side");
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(OUTSIDE);
      expect(r.output).toContain(short(sideSha));
      expect(r.output).not.toContain("lock check passed");

      // main's own commits, brought in by a merge, are not the builder's
      const merged = ticketRepo();
      const tip = head(merged.dir);
      git(merged.dir, "checkout", "-q", "main");
      commit(merged.dir, "main: schema change", { [OUTSIDE]: "// main's own change\n" });
      commit(merged.dir, "main: docs", { "docs/design/notes.md": "# main's own note\n" });
      git(merged.dir, "checkout", "-q", "--detach", tip);
      builderCommit(merged.dir, [TERRITORY_FILE]);
      git(merged.dir, "merge", "--no-ff", "-m", "merge main into the ticket branch", "main");
      const r2 = runLocks(merged.dir, BRANCH);
      expect(r2.output).toContain("lock check passed");
      expect(r2.status).toBe(0);
    },
    LONG,
  );
});

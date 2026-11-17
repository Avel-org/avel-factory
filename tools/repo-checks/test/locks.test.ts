import { describe, expect, test } from "vitest";
import {
  BRANCH,
  builderCommit,
  editLocks,
  git,
  LOCKED_TEST,
  REPORT,
  runLocks,
  TERRITORY_FILE,
  ticketRepo,
} from "./helpers.ts";

const LONG = 240_000;

describe("lock check (H6)", () => {
  test(
    "a builder commit inside the build doc's Territory passes",
    () => {
      const { dir } = ticketRepo();
      builderCommit(dir, [TERRITORY_FILE, "packages/server/src/main.ts", REPORT]);
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "a builder commit touching a file outside the Territory fails and names the file",
    () => {
      const { dir } = ticketRepo();
      builderCommit(dir, [TERRITORY_FILE, "packages/db/src/schema.ts"]);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain("packages/db/src/schema.ts");
      expect(r.output).not.toContain("lock check passed");
    },
    LONG,
  );

  test(
    "a builder commit touching a locked path fails, even when the path also matches the Territory",
    () => {
      const guarded = "packages/server/src/http/guarded.ts"; // inside packages/server/src/http/**
      const { dir } = ticketRepo({ extraLocked: [guarded] });
      builderCommit(dir, [guarded]);
      const r = runLocks(dir, BRANCH);
      expect(r.status).toBe(1);
      expect(r.output).toContain(guarded);

      // and the checker's own test, which is outside the Territory and locked, fails too
      const second = ticketRepo();
      builderCommit(second.dir, [LOCKED_TEST]);
      const r2 = runLocks(second.dir, BRANCH);
      expect(r2.status).toBe(1);
      expect(r2.output).toContain(LOCKED_TEST);
    },
    LONG,
  );

  test(
    "commits at or before the lock sha aren't held to the builder's Territory",
    () => {
      // the checker's commit touches files outside the Territory (its tests and a helper)
      const { dir } = ticketRepo({
        testFiles: [LOCKED_TEST, "packages/server/test/helpers.ts", "tools/repo-checks/test/x.ts"],
      });
      builderCommit(dir, [TERRITORY_FILE]);
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "a t/* branch with no rendered build doc or no locks.md line fails with a reason",
    () => {
      // no build doc: T-B9 isn't in the plan
      const ghost = ticketRepo({ branch: "t/B9-ghost" });
      builderCommit(ghost.dir, [TERRITORY_FILE]);
      const noDoc = runLocks(ghost.dir, "t/B9-ghost");
      expect(noDoc.status).toBe(1);
      expect(noDoc.output).toContain("T-B9");

      // a rendered build doc, but the lead hasn't written the lock line
      const unlocked = ticketRepo({ locksLine: false });
      builderCommit(unlocked.dir, [TERRITORY_FILE]);
      const noLine = runLocks(unlocked.dir, BRANCH);
      expect(noLine.status).toBe(1);
      expect(noLine.output).toContain("T-B2");
      expect(noLine.output).toContain("locks.md");
    },
    LONG,
  );

  test(
    "a branch not named t/* passes and says it isn't a ticket PR",
    () => {
      const { dir } = ticketRepo({ branch: "feature/anything" });
      // it would fail as a ticket PR: a file outside every Territory
      builderCommit(dir, ["packages/db/src/schema.ts"]);
      const r = runLocks(dir, "feature/anything");
      expect(r.output).toContain("not a ticket PR");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "a builder can't move its lock line's sha forward or drop a path from it",
    () => {
      // case 1: the line's sha is rewritten to a later commit, then the builder leaves the Territory
      const moved = ticketRepo();
      builderCommit(moved.dir, [TERRITORY_FILE]);
      const later = git(moved.dir, "rev-parse", "HEAD");
      editLocks(moved.dir, (t) => t.replace(moved.lockSha, later));
      builderCommit(moved.dir, ["packages/db/src/schema.ts"]);
      const r1 = runLocks(moved.dir, BRANCH);
      expect(r1.status).toBe(1);
      expect(r1.output).toContain("locks.md");

      // case 2: a path is dropped from the line, then the builder edits it. The path is inside
      // the Territory, so only the line (not the Territory) can hold it.
      const guarded = "packages/server/src/http/guarded.ts";
      const dropped = ticketRepo({ extraLocked: [guarded] });
      editLocks(dropped.dir, (t) => t.replace(`, ${guarded}`, ""));
      builderCommit(dropped.dir, [guarded]);
      const r2 = runLocks(dropped.dir, BRANCH);
      expect(r2.status).toBe(1);
      expect(r2.output).toContain("locks.md");

      // and the same drop of the checker's own test, then an edit to it
      const test = ticketRepo({ extraLocked: [guarded] });
      editLocks(test.dir, (t) => t.replace(`${LOCKED_TEST}, `, ""));
      builderCommit(test.dir, [LOCKED_TEST]);
      const r3 = runLocks(test.dir, BRANCH);
      expect(r3.status).toBe(1);
      expect(r3.output).toContain(LOCKED_TEST);
    },
    LONG,
  );
});

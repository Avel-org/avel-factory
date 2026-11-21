import { describe, expect, test } from "vitest";
import {
  BRANCH,
  builderCommit,
  commit,
  editLocks,
  LOCKED_TEST,
  runLocks,
  TERRITORY_FILE,
  ticketRepo,
} from "./helpers.ts";

// Nov 21 (T-F12, T-F23): a checker's F2 fix that adds a test file, followed by a relock that locks it, must pass.
// Before, the fix was held to the Territory and the first lock's paths, so the new file failed.

const LONG = 240_000;
const NEW_TEST = "packages/server/test/shell-extra.test.ts";

describe("lock check: an F2 fix that adds a test file (Nov 21)", () => {
  test(
    "passes when the relock that follows it lists the new file",
    () => {
      const { dir } = ticketRepo();
      builderCommit(dir, [TERRITORY_FILE]);
      const fix = commit(dir, "checker: F2 adds a test", {
        [LOCKED_TEST]: "// the checker's fixed test\n",
        [NEW_TEST]: "// a new test file\n",
      });
      editLocks(dir, (t) => `${t}- T-B2: ${LOCKED_TEST}, ${NEW_TEST} @ ${fix} (F2 relock)\n`);
      builderCommit(dir, ["packages/server/src/main.ts"]);
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "still fails when no relock lists the new file",
    () => {
      const { dir } = ticketRepo();
      const fix = commit(dir, "checker: F2 adds a test", {
        [LOCKED_TEST]: "// the checker's fixed test\n",
        [NEW_TEST]: "// a new test file\n",
      });
      editLocks(dir, (t) => `${t}- T-B2: ${LOCKED_TEST} @ ${fix} (F2 relock)\n`);
      const r = runLocks(dir, BRANCH);
      expect(r.status).not.toBe(0);
      expect(r.output).toContain(`${NEW_TEST}: outside the Territory`);
    },
    LONG,
  );
});

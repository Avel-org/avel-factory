import { describe, expect, test } from "vitest";
import {
  BRANCH,
  builderCommit,
  commit,
  git,
  runLocks,
  TERRITORY_FILE,
  ticketRepo,
} from "./helpers.ts";

// CR-46 B4: after the lock, a builder may add one line to its own memory file, .agents/memory/soap.md
// (the example plan's backend builder), and nothing more: not two lines, not an edit, not another
// agent's file.

const LONG = 240_000;
const MINE = ".agents/memory/soap.md";
const OTHER = ".agents/memory/fantem.md";

function withMemory(dir: string): void {
  // The memory files are on main before the ticket starts, as in the real repo, and main is merged in.
  const head = git(dir, "rev-parse", "HEAD").trim();
  git(dir, "checkout", "-q", "main");
  commit(dir, "memory files", { [MINE]: "# Soap's lessons\n", [OTHER]: "# Fantem's lessons\n" });
  git(dir, "checkout", "-q", "--detach", head);
  git(dir, "merge", "-q", "--no-edit", "main");
}

describe("lock check: the builder's memory file (CR-46 B4)", () => {
  test(
    "one added line in the builder's own memory file passes",
    () => {
      const { dir } = ticketRepo();
      withMemory(dir);
      builderCommit(dir, [TERRITORY_FILE]);
      commit(dir, "a lesson", {
        [MINE]: "# Soap's lessons\n- Run pnpm build once in a fresh worktree.\n",
      });
      const r = runLocks(dir, BRANCH);
      expect(r.output).toContain("lock check passed");
      expect(r.status).toBe(0);
    },
    LONG,
  );

  test(
    "two added lines, a changed line, or another agent's memory file fail",
    () => {
      for (const [file, body, why] of [
        [MINE, "# Soap's lessons\n- one\n- two\n", "adds 2"],
        [MINE, "# Soap's notes\n", "removes 1"],
        [OTHER, "# Fantem's lessons\n- not mine\n", "outside the Territory"],
      ] as const) {
        const { dir } = ticketRepo();
        withMemory(dir);
        commit(dir, "memory", { [file]: body });
        const r = runLocks(dir, BRANCH);
        expect(r.status, `${file}: ${body}`).not.toBe(0);
        expect(r.output).toContain(why);
      }
    },
    LONG,
  );
});

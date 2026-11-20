import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fixtures } from "@avel/contract-mock";
import { expect, test as setup } from "@playwright/test";

/** Where the signed-in state is saved: under test-results/, which git ignores. */
export const STATE = join(import.meta.dirname, "../../test-results/.auth/operator.json");

// T-F12-09 · LG-23: sign in once, on the mock's wire, and keep the cookie for every other spec.
// (Playwright's outputDir is emptied before the run starts, so this file is written fresh each time.)
setup("sign in once and save the state", async ({ request }) => {
  const res = await request.post("/api/auth/sign-in/email", {
    data: { email: fixtures.operator.email, password: fixtures.operator.password },
  });
  expect(res.status(), "the mock signs the operator in").toBe(200);
  mkdirSync(dirname(STATE), { recursive: true });
  await request.storageState({ path: STATE });
  const saved = await request.storageState();
  expect(saved.cookies.map((c) => c.name)).toContain("better-auth.session_token");
});

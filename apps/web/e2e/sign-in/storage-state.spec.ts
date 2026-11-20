import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { booted } from "../control-room/support";
import { attachShot } from "../support/page";
import { onLogin, SESSION_COOKIE } from "./helpers";

// T-F12-09 · LG-23. The config's "setup" project (e2e/support/auth.setup.ts) signs in once and saves
// the state here; every project but "sign-in" and "lockout" starts from it.
const STATE = join(import.meta.dirname, "../../test-results/.auth/operator.json");

test("setup saved a session cookie for the other projects, and this project starts signed out", async ({
  browser,
  page,
  context,
}, info) => {
  const parsed = JSON.parse(readFileSync(STATE, "utf8")) as {
    cookies: Array<{ name: string; httpOnly: boolean }>;
    origins: Array<{ localStorage: unknown[] }>;
  };
  expect(parsed.cookies.map((c) => c.name)).toContain(SESSION_COOKIE);
  for (const origin of parsed.origins) expect(origin.localStorage).toEqual([]);

  // The LG specs start signed out: this context has no cookie, and / goes to Sign in.
  expect(await context.cookies()).toEqual([]);
  await page.goto("/");
  await onLogin(page);

  // A context made from the saved state opens the control room, with no sign-in.
  const signedIn = await browser.newContext({
    storageState: STATE,
    baseURL: info.project.use.baseURL,
  });
  const inPage = await signedIn.newPage();
  await inPage.goto("/");
  await booted(inPage, "Decisions");
  await attachShot(inPage, info, "storage-state-signed-in");
  await signedIn.close();
});

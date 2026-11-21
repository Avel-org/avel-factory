import { fixtures } from "@avel/contract-mock";
import { type APIRequestContext, expect } from "@playwright/test";

/**
 * T-F12-10 (F2, Nov 21): a production preview serves contract-mock on /api only when it starts
 * with AVEL_API=mock, and the guard sends a signed-out visitor to /login. So every preview spec
 * starts its server with this environment and signs in on the preview's own mock first.
 */
export const PREVIEW_ENV = { AVEL_API: "mock", NO_COLOR: "1", FORCE_COLOR: "0" } as const;

/**
 * Signs the operator in on the preview's own mock. The mock's sessions are its own, so the
 * setup project's cookie (saved from the dev server) doesn't count here. Pass `page.request`
 * to sign the page in (it shares the page's cookie jar), or the `request` fixture for that one.
 */
export async function signInOnPreview(ctx: APIRequestContext, origin: string): Promise<void> {
  const res = await ctx.post(`${origin}/api/auth/sign-in/email`, {
    data: { email: fixtures.operator.email, password: fixtures.operator.password },
  });
  const text = await res.text();
  expect(res.status(), "the preview's mock signs the operator in (AVEL_API=mock)").toBe(200);
  // A preview with no /api can answer 200 with its own page, so read the mock's answer too.
  expect(
    text.trimStart().startsWith("{"),
    `sign-in's body is the mock's JSON, not a page (got: ${text.slice(0, 40)})`,
  ).toBe(true);
  const cookies = (await ctx.storageState()).cookies.map((c) => c.name);
  expect(cookies, "the mock set the session cookie").toContain("better-auth.session_token");
}

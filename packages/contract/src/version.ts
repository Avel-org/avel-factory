/**
 * The contract's version (S1-2, backend sprint-01 decisions). It always equals
 * `packages/contract/package.json`'s `version`, and a contract test checks the two agree.
 *
 * - The server sends it in `X-Contract-Version` on every response.
 * - The web imports it as the version it was built against.
 * - The CLI compares against it (CR-14, item 5).
 *
 * Bump rule (Commit Convention v1): `feat(contract)` bumps the minor, `feat(contract)!` the
 * major, `fix(contract)` the patch. `1.0.0` is the first released version: it carries CR-20,
 * CR-W2, CR-W5 and the web's CR-W1 to CR-W22 together.
 */
export const CONTRACT_VERSION = "1.0.1";

/**
 * The session cookie names Better Auth writes (S1-10): the `__Secure-` one over https,
 * the plain one over http.
 */
export const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
] as const;

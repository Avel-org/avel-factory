/** `next` is kept only when it's this long or shorter (login.md section 2, rule 1). */
const MAX_NEXT = 2048;
// biome-ignore lint/suspicious/noControlCharactersInRegex: rule 2 refuses exactly these characters
const CONTROL = /[\u0000-\u001f\u007f]/;

/**
 * login.md section 2 (login-uic-brennan-02): `next` is kept only when it's a string of at most
 * 2,048 characters, has no control character, starts with exactly one `/`, parses to the app's
 * origin and isn't `/login`. The target is the parsed URL's pathname, search and hash, never the
 * raw string. Anything else gives `/`.
 */
export function safeNext(raw: unknown, origin: string): string {
  if (typeof raw !== "string" || raw.length > MAX_NEXT || CONTROL.test(raw)) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return "/";
  }
  if (url.origin !== new URL(origin).origin || url.pathname === "/login") return "/";
  return url.pathname + url.search + url.hash;
}

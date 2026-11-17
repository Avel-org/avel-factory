status: open
severity: P1
owner: Zero (login.md section 2 and LG-03), then Leon (validateSearch) and Fenn (LG-03)

# login-uic-brennan-02: the `next` rule's prefix checks let a tab or newline send the operator off-site

## What the contract says
- `login.md:36`: "`/login`'s `validateSearch` keeps it only if it starts with `/`, not with `//` or `/\`, and isn't `/login`. Otherwise it's dropped … No open redirect."
- `login.md:35` and `login.md:72`: a signed-in visit to `/login` and a 200 both navigate to `next`. On the server, the first one is a redirect response.
- `login.md:123`, LG-03: `//evil`, `/\evil`, `https://x`, `/login` and none go to `/`.

## Why the build goes wrong
The URL parser removes ASCII tab, LF and CR from anywhere in a URL before it resolves it. So `next=%2F%09%2Fevil.example` decodes to `"/\t/evil.example"`. That passes all three prefix checks, then resolves to `//evil.example`: a protocol-relative URL on another host. A `Location` header may carry a tab, so the server redirect on line 35 sends the operator to that host. That's the classic sign-in open redirect: a phishing link that lands on a look-alike page after a real sign-in. LG-03 would lock the incomplete rule in as correct.

## Evidence
```text
$ node -e 'const keep=n=>n.startsWith("/")&&!n.startsWith("//")&&!n.startsWith("/\\")&&n!=="/login";
  for (const n of ["/\t/evil.example","/\n/evil.example","/missions?x=1","/login?x=1"])
  console.log(JSON.stringify(n),"kept:",keep(n),"->",new URL(n,"http://app.test").href)'
"/\t/evil.example" kept: true -> http://evil.example/
"/\n/evil.example" kept: true -> http://evil.example/
"/missions?x=1" kept: true -> http://app.test/missions?x=1
"/login?x=1" kept: true -> http://app.test/login?x=1
```

## What fixing it means
- Section 2 replaces the prefix checks with a check on the parsed URL. Resolve `next` with `new URL(next, origin)`, and keep it only when:
  - the raw value starts with a single `/`;
  - it has no control characters (`\u0000`–`\u001f`, `\u007f`);
  - the parsed `origin` equals the app's origin;
  - the parsed `pathname` isn't `/login`.
- Then redirect to the parsed `pathname + search + hash`, never to the raw string.
- LG-03 adds `/\t/evil.example`, `/\n/evil.example` and `/login?x=1`, each going to `/`.

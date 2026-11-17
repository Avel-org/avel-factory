status: open
severity: P1
owner: Zero (login.md section 2 and LG-06), then Leon (login build) and Fenn (LG-06)

# login-uic-brennan-01: after a contract 401, `/login`'s own guard sends the operator back, so the expired notice is never drawn and LG-06 can't pass

## What the contract says
- `login.md:29`: `sessionQueryOptions` has `staleTime: Infinity`. "It's invalidated on sign-in and on a 401."
- `login.md:33`: `__root`'s `beforeLoad` "awaits `ensureQueryData(sessionQueryOptions)`".
- `login.md:35`: "**Signed in on `/login`:** a redirect to `next`, or to `/`."
- `login.md:40`: on a `signedOut` error, "it invalidates the session and navigates to `/login?next={current path and search}&reason=expired`".
- `login.md:99`: "Contract routes don't check the session … A 401 is tested with `failNext`", so the mock's session is still valid after the 401.
- `login.md:126`, LG-06: "one navigation to `/login?next=…&reason=expired`, and the expired notice's copy."

## Why the build and its test go wrong
1. **Invalidating doesn't refetch the session.** `invalidateQueries` marks the query stale and refetches only *active* queries (those with a mounted observer). The guard reads the session through `ensureQueryData`, which mounts no observer. And `ensureQueryData` returns cached data even when it's stale, unless `revalidateIfStale` is set. So the navigation to `/login` finds the old signed-in session in the cache, and line 35 redirects straight back to `next`: the page that just got the 401.
2. **On the mock it fails even with a refetch.** `failNext` fails one contract route and leaves the mock's session alone (line 99). A refetched `get-session` still answers signed in, so line 35 redirects again. The expired notice (`login.md:54`) never shows, and LG-06's second half can't pass with any build that follows sections 2 and 5.
3. **On a real server it can loop.** If the session read still succeeds (a 401 from a route whose own check failed, for example), the page refetches, gets 401, and the subscription navigates again. "Once per 401 burst" (line 41) doesn't stop this, because each bounce is a new burst.

## Evidence
```text
$ sed -n 139,146p node_modules/.pnpm/@tanstack+query-core@5.107.1/.../build/modern/queryClient.js   (read in the main checkout)
	ensureQueryData(options) {
		...
		const cachedData = query.state.data;
		if (cachedData === void 0) return this.fetchQuery(options);
		if (options.revalidateIfStale && query.isStaleByTime(...)) this.prefetchQuery(defaultedOptions);
		return Promise.resolve(cachedData);
$ sed -n 329,338p .../queryClient.js
	invalidateQueries(filters, options = {}) {
		... query.invalidate();
		return this.refetchQueries({ ...filters, type: filters?.refetchType ?? filters?.type ?? "active" }, options);
```

## What fixing it means
- In section 2, a `signedOut` error **sets the session's query data to `null`** (it doesn't just invalidate it) before it navigates. A contract 401 means the server no longer accepts the session, and that is what the web believes until it signs in again. Line 29 changes to match.
- Also say what `/login` does with `reason=expired` when it's signed in: either it still draws the page, or the null above is enough. Pick one and write it down.
- LG-06 then states that the mock's session is still valid, and asserts that the notice is drawn and that there's no second navigation.

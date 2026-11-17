# Frontend sprint-02: backlog

P3s from reviews (procedures rule 2): one line each, with the finding and the review it came from. Nothing here blocks.

## From Brennan's layout-uic review a1 (P3, copied by Zero)

1. **`kit-v1.9.md` doesn't record v1.9's `.pd` container queries.** These are DL v1.9's "v1.9 Container queries" block: at 480px `.pd-body` goes to one column, `.pd-top` wraps and `.pd-project` gets its own line; at 380px `.pd-actions` go to one column. Either say they change nothing on the built tag, because D16's 899px query already draws the phone layout, or adopt them (layout-uic-brennan a1).
2. **`kit-v1.9.md`'s Button row names `.av-spin`** but not its `@keyframes av-spin` or its reduced-motion rule (DL v1.9, "Busy spinner") (a1).
3. **All projects' lead promises too much.** `Every project, with its client and state.`† promises a state that the content (a link per row) doesn't show. It also says "every" while closed and cancelled projects are left out (`shell-layout.md` section 5, section 4's project rows) (a1).
4. **Crumbs and tabs depart from DL with no S-number.** The project-page crumbs `[All projects, {project}, {page}]` depart from DL's `.lib-app` crumbs (one crumb per screen), and the tabs are links with `href`, where DL's `jme` draws buttons (`shell-layout.md` sections 4 and 2) (a1).
5. **Sprint-03 hrefs.** Library `/library/skills` and Client knowledge `/library/client` differ from FM's `/library/$kind` and DL's `/library/client/$clientId`. Section 4 derives each href from the route path (`staticData.nav` carries no href), so it can't produce them from param routes. Settle this in sprint-03's contract (a1).
6. **A stray space** before the comma after `scroll-padding-top: 76px` (`shell-layout.md` section 1) (a1).

## From Brennan's login-uic review a1 (P3, copied by Zero)

1. **The retry header.** Section 1 reads `X-Retry-After`, while FM line 221 and CR-W8 name `Retry-After`. Read both, and add this to escalation 04 (a1).
2. **The failure count.** Section 5 doesn't say whether a right password resets it (escalation 04) (a1).
3. **The web session length.** The mock's 12 hours comes from CLI sessions (plan item 7). No web session length is written down (escalation 04) (a1).
4. **The footer.** `mh` puts its alert and footer band inside the `<form>`, but section 3's markup items 5 and 6 read as siblings of the form. A `type="submit"` outside it doesn't submit. Leon builds them inside it (a1).
5. **Focus.** The browser's autofill can't be read on load, so focus Email always (section 3) (a1).
6. **The session read's retries and caching.** With `data/query.ts`'s defaults (3 retries), a failed session read takes seconds to count as signed out. A failure cached as `null` with `staleTime: Infinity` then stays signed out until the next sign-in. Say which is wanted (section 2) (a1).
7. **Navigating to `next`.** It has a search string, so use `href`, not `to` (a1).
8. **Coverage gaps.** No LG checks section 0's "no `better-auth` package, `fetch` only in `api.ts`", or `sessionQueryOptions`' key and `staleTime` (a1).

The P3 on "once per 401 burst" is answered in revision 2: until the navigation to `/login` settles.

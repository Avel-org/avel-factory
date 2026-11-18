# CR-W29: The control room comes from the design export (accepted)

Nov 17, 2026 · drafted by Zero for @javaris · frontend lane · touches Build rules E2, E4, E14, E16, `docs/ui-contracts/shell-layout.md`, `kit-v1.9.md`, and the locked tests of T-F1 and T-F2

**Accepted Nov 17, 2026** by Javaris (to OSA: "Approve CR-W29"), as drafted: option B (the JSX hosted in the existing TanStack Start, React 19 and Vite 8 app), with decisions 1 to 6 as recommended and every rule change below. On the four questions he answered first: drop T-F5 unmerged and cancel T-F6, T-F3 and T-F4; the sample world first, then the contract screen by screen; the source as-is first, with TypeScript and TanStack routing coming later, screen by screen. He didn't rule on the setup.css question, which stays open.

## What

`apps/web` stops building the control room screen by screen. Instead, it carries the design export (`avel-control-room`, Javaris's Claude Design project: React JSX, its 28 stylesheets and its sample world) unchanged, and shows every screen from it at `/`. The shell `apps/web` built so far (T-F2's frame, rail, header and tab bar) is removed.

- **The source:** `C:\Users\javar\Desktop\avel-control-room` (in WSL, `/mnt/c/Users/javar/Desktop/avel-control-room`): 221 files, about 35,600 lines. Its `handoff/` folder is already in the repo, byte for byte, as `docs/ui-reference/control-room-handoff/`.
- **Where it lands:** `apps/web/control-room/`, holding the export's `src/`, `contract/` and `tools/check-contract.mjs` at their own relative paths. It leaves out `node_modules/`, `dist/`, `scratch/`, `index.html` and the npm and prettier files. Its `tests/e2e/` scripts aren't copied: the checker ports them as Playwright tests in `apps/web/e2e/`.
- **How it lands:** the build's first commit is a byte-for-byte copy, with a `SOURCE.md` listing each file's SHA-256. Every later commit is an adaptation the reviewer can read on its own, and each file it changes is named, with its reason, in `SOURCE.md`'s "Changed for apps/web" section. The listed hashes stay the copied ones, so the section is the full record of what apps/web changed in Javaris's design.

## Why

Javaris, Nov 17: "remove the app shell; we're going to use the design UI from the control room zip … it should be our frontend UI, fully displayed, so we don't have to build the entire frontend." The export already renders every screen of the control room in its finished design. Rebuilding that design ticket by ticket (T-F2 to T-F6) took a sprint per slice of the sidebar.

## Decisions (all accepted Nov 17 as recommended)

| # | Question | Recommendation | Why |
| --- | --- | --- | --- |
| 1 | T-F5 passed review and waits on a merge. Merge it or drop it? | **Drop it.** Close it unmerged and keep the branch as a record | T-F7 deletes everything T-F5 adds (its pages, ScreenHeader, the Empty-based WidgetState) in the very next PR. Merging would add `class-variance-authority` and a lockfile change only to remove them |
| 2 | Do T-F6, T-F3 and T-F4 stand? | **Withdraw all three.** Never render them again, and don't merge `plan/f3-shell-sheet` or `plan/f4-shell-rail` | The export's Sidebar already has the Projects group, its sheet, the collapse and the badges |
| 3 | Sample world first, or contract-mock from the start? | **The sample world first, then contract-mock screen by screen**, in the handoff's port order (`control-room-handoff/README.md`, "Port order") | "Fully displayed" now. The sample world is in contract 1.0.0 shapes, and `check-contract.mjs` refuses any route, event or query key the contract lacks. Wiring first would mean rewriting `logic.js`'s data layer before anything shows |
| 4 | Keep apps/web's stack, or take the export's React 18 and Vite 6 as they are? | **Keep apps/web as the host** (TanStack Start, React 19, Vite 8, pnpm, Playwright). Carry the export's JSX as it is, without converting it to TypeScript. Mount it client-only at `/` | Converting 35,600 lines to strict TypeScript is the rebuild Javaris wants to skip. Dropping TanStack Start would lose the contract client, server functions (which keep schemas out of the browser) and the place sign-in will live, all needed when the wiring starts. The export routes by hash (`#/…`), so it sits inside one TanStack route without the two routers fighting |
| 5 | One new runtime package | **Approve `thinking-orbs` 0.3.2**, pinned exactly | MIT licence, peer `react >=18`, 148 KB unpacked. `src/kit/Trail.jsx` draws a running agent with it. Nothing in apps/web draws that orb |
| 6 | The JavaScript budget (E16) | **A temporary ceiling of 350 KB gzipped for `/` from T-F7, and 150 KB again from T-F8** | The export loads everything on first paint: 1.0 MB of JS and JSX source plus 0.3 MB of sample JSON. I estimate 270 to 330 KB gzipped with React and TanStack, but haven't measured it. If T-F7 measures over 350 KB, it stops with `needs-cr` rather than raising the ceiling |

## What changes in the rules, and for how long

- **E2 (build against contract-mock):** the ported control room reads its sample world (`control-room/src/mock/*.json`) until each screen's wiring ticket moves it to the oRPC client over contract-mock. Until then, `check-contract.mjs` runs in `pnpm test` (T-F10). This lasts until the last screen is wired, and the step can't close before that.
- **E4 (strict TypeScript, Biome with no warnings):** `apps/web/control-room/**` is plain JSX, left out of `tsc` and Biome. One declaration file types the entry the TanStack route imports. Formatting with Biome would rewrite every line and bury the review, so it waits. "No `console.log`" still holds there, through a test. New code stays TypeScript and Biome-clean. This lasts until a later ticket brings the tree under both, or Javaris accepts the exemption as permanent.
- **E14 (shell and sign-in before any page):** the export comes with every page at once, so sign-in follows the port. Sign-in (`docs/ui-contracts/login.md`, full rigor, C4) is the first ticket of the wiring sprint, before any screen talks to the API.
- **E16:** see decision 6. The budget test measures everything `/` loads before Decisions is interactive, not only what the server's HTML preloads. A client-only page would otherwise pass while loading far more.

**Amendment to decision 6 (Nov 17), accepted by Javaris** (to OSA: "220 KB now, 150 via wiring"): `/` is held to 220 KB gzipped from T-F8, and the limit is only ever lowered. 150 KB returns as the done-when of the wiring. If the wiring can't reach it, a CR decides with measured numbers.

Why: T-F8 measured `/` at about 355 KB, and the floor once every other page's code loads on demand at about 205 to 215 KB. The framework alone is about 108 KB: React about 69 KB and TanStack Start and Router about 39 KB. `logic.js`, which holds every page's values, is about 40 KB. Splitting `logic.js` would reach about 170 to 180 KB. 150 would also need TanStack out of `/`, which reverses decision 4. Each screen's wiring ticket moves that screen's values out of `logic.js` and drops its mock data, so the wiring does that split one screen at a time.

- **Server rendering:** `/` renders on the client only (`ssr: false`), because the export reads `window` and `location.hash` from its first line. T-F1 and T-F2's "the server's HTML carries the shell" retires with the shell. A skeleton paints until the app boots.
- **Styles:** at `/`, the export's 28 stylesheets (every CSS file `src/main.jsx` imports), in its order, are the only global styles. T-F1's `tokens.css` and `app.css` stay in the repo, and their tests stay, but `/` doesn't load them: Tailwind's preflight would change the export's look.
- **`docs/ui-contracts/shell-layout.md` and `kit-v1.9.md`** are superseded by the export itself and by `docs/ui-reference/control-room-design-fidelity.md` (once that lands on main). Each gets a line at the top saying so, in T-F7's PR (E7).

## The locked tests that retire

The checker deletes these in T-F7's tests dispatch, in its own commit, under this CR (F2):

- **T-F2:** `apps/web/test/shell/app-shell.test.tsx`, `kit-css.test.ts`, `nav.test.ts`, `support.tsx`, and `apps/web/e2e/shell/a11y.spec.ts`, `frame.spec.ts`, `hydration.spec.ts`, `support.ts`.
- **T-F1:** `apps/web/test/home-loader.test.ts`, `home-loader-states.test.ts`, `home-view.test.ts`, and `apps/web/e2e/home.spec.ts`, `states.spec.ts`. These cover the old home over route 52, which the export's Decisions replaces.
- **`apps/web/e2e/budget.spec.ts`** changes rather than retires: it measures what decision 6 and E16 above say.

These stay as they are: `foundation.test.ts`, `gitignore.test.ts`, `hygiene.test.ts` (no `innerHTML` and no classic zod, which now covers the export too), and `e2e/support/*`.

**Amendment (Nov 17), accepted by Javaris** (to OSA: "approve the amendment, run it"): `hygiene.test.ts` stays, except that its first test, "apps/web/src exists and has the files this ticket adds", drops its two `src/home` lines. Its `data/client.ts`, `lib/utils.ts` and `routes/__root` checks, and every other test in the file, stay. The checker's edit is in T-F7's commit a04d7a9, together with the retired tests' deletion. `apps/web/src/data/client.ts` stays for the wiring sprint.

## What doesn't bend

- No money. No `$` anywhere, sample data included, and AI cost shows only against its cap (E15). The export's own `audit-contract-rules` becomes a test.
- Agent, client and Canon text renders as text. The export has no `innerHTML`, and `hygiene.test.ts` keeps it that way.
- No polling. The export makes no network calls. Its `setInterval`s drive the sample world's live rack, Canon's streaming and small animations, and they go when each screen is wired.
- OSA (CR-29, proposed) stays behind its flag (`?osa=1`). With the flag off, nothing of OSA shows.
- The Prototype dock and viewport preview (`src/dev/`) show only in a dev build.
- WCAG 2.2 AA on every screen, at 1280 and 390, light and night (E17).

## The plan

`docs/agent-dispatch/frontend/sprint-07` to `sprint-11`, one ticket each, because each ticket changes files the next one changes (B7), as T-F5 and T-F6 did. They run in order:

1. **T-F7:** the control room runs at `/`, and the old shell is gone.
2. **T-F8:** `/` loads each page's code when it opens, and is held to 220 KB of JavaScript (decision 6, as amended).
3. **T-F9:** every screen shows and passes WCAG 2.2 AA.
4. **T-F11** (sprint-10, added Nov 17, Javaris: "Approve T-F11"): the web's end-to-end tests run in CI. No Playwright test ran in CI before it, although H4 and F6 require them.
5. **T-F10** (sprint-11, moved from sprint-10 so that the sprints follow the run order): the rules hold.

The wiring sprint follows, in the handoff's port order, starting with sign-in.

**Correction (Nov 17):** the export loads 28 stylesheets, not 29. The 29th entry in `src/styles/` is the `fonts/` folder. The rendered sprint-07 task docs still say 29, kept rather than re-rendered mid-ticket. T-F7's tests count what `main.jsx` imports.

## Open questions

- `control-room-design-fidelity.md` §4.16 names `setup.css` ("Getting started, Connections, the welcome and phase bars"), but the export has no `setup.css`. Either the spec runs ahead of the export, or the export is missing a file. T-F7 copies what the export holds.
- The export sits on a desktop. If it changes after T-F7's copy, `SOURCE.md`'s hashes show what we took. A newer export comes in through its own ticket.

## Done when

- `/` shows the export's Decisions home, and every screen in its page registry opens by its `#/` route, looking as the export does.
- T-F2's shell and T-F1's old home are gone, along with their tests.
- `/` loads at most 220 KB of JavaScript, gzipped, from T-F8 (decision 6, as amended), and 150 KB once the wiring is done.
- axe finds no WCAG 2.2 AA violation on any screen.
- `check-contract.mjs` and the no-money check run in `pnpm test`.

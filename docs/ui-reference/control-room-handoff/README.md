# AVEL Control Room — handoff to the frontend team

This folder is everything you need to build `avel-factory/apps/web` from the prototype. The prototype is the source of truth for **how it looks and behaves**. `packages/contract` is the source of truth for **data**. Where the two disagree, the screen waits on a contract change request (CR); never fake an endpoint to close the gap.

## What's in here

| File            | What it is                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.css`    | A Tailwind v4 `@theme` block: colour (light and night), type, spacing, radius, shadow, motion, plus the code and receipt tokens. Drop it into `apps/web/src/styles/app.css`                                                                         |
| `tokens.json`   | The same tokens as data, for anything that isn't CSS                                                                                                                                                                                                |
| `screens.md`    | Every screen: route, what it's for, the contract calls it reads and writes, the events that keep it live, every state, its empty state, phone notes, and the CRs it waits on. Generated from the prototype's page registry, so it matches the build |
| `components.md` | Each prototype component and what it becomes in shadcn/ui, or "build it" when nothing fits. Motion and accessibility rules                                                                                                                          |

The rest of the zip is the prototype itself (`src/`), its sample data (`src/mock/*.json`, in contract 1.0.0 shapes and written by the `tools/make-*.py` scripts), the contract index and check (`contract/`, `tools/check-contract.mjs`) and the end-to-end checks (`tests/e2e/`). `cr-list-1-0-0.md` is what the contract still lacks.

## Run the prototype

```bash
npm i
npm run dev        # http://localhost:5173
npm run build      # checks every route and event against contract 1.0.0, then builds one dist/index.html
npm run test:e2e   # every flow and audit; screenshots go to .artifacts/
npm run test:e2e -- flow-receipt   # just the scripts whose names match
```

The tests use Playwright and axe-core. Set `APP_URL` to point them at a running server instead of `dist/`. The scripts find things by the prototype's class names, so as you port a screen, move its script's selectors to roles, labels or `data-testid` and point it at `apps/web`. The steps and the checks stay the same.

## Port order

Build in this order. Each step should pass its e2e scripts against the contract mock before the next starts, then again against the real API.

1. **Foundation.** TanStack Start app, Tailwind v4 with `tokens.css`, shadcn/ui init, the oRPC client from `packages/contract`, the event stream hook, and the error map (every error code gets the sentence in `screens.md`). Light and night.
2. **Shell.** Sidebar, top bar, phone tab bar, command palette, sheets, toasts. `flow-keyboard`, `flow-palette`, `flow-sheets`.
3. **Decisions (home).** Queue, card, approve in one tap, Undo for 6 seconds, the 409 stale state. Phone first. `flow-phone`, `flow-checkpoint-decisions`.
4. **Projects.** List, overview with the gate bar and modules, the masthead and its tabs. `flow-project-tabs`, `flow-gate0`.
5. **Live.** The factory floor and the module page: retry ladder, cost against cap, the live feed of agent steps. `flow-module-live`.
6. **Canon onboarding.** The checkpoint page, the dock (question deck, relay line, hold to relay) on `useChat` over oRPC streaming (CR-W19). `flow-canon-dock`, `audit-axe-dock`.
7. **Release.** Findings, the release page, and the receipt with its proof check. Phone first. `flow-release`, `flow-receipt-check`.
8. **Library.** Templates with their docs, the template authoring flow, skills, rules, the agent roster. `flow-template-docs`, `flow-roster`.
9. **Clients.** Pipeline and intake (CR-W17). No money anywhere.
10. **Audits last, and on every PR after.** `audit-*` scripts: axe on every route, type and target sizes, icon and button spacing, no focus ring on click, nothing off the scale.

## Rules that aren't obvious from the screens

- **Decisions is home.** Approving never asks for a password. Only credential actions (keys, tokens, account owner) ask to confirm the password again.
- **Everything agents and clients wrote is untrusted.** Render it as text. Markdown runs with HTML off. Code blocks never execute anything.
- **No money in the control room.** No `$` anywhere, sample data included: no margin, prices, invoices or payments. AI use shows only as used against its cap, or a percent. `audit-contract-rules` fails on any `$`.
- **Nothing polls** except the stall check (`StatusDto.stallAfterMs`). Everything else stays live through the event stream.
- **OSA (CR-29) is proposed and sits behind a flag** (`?osa=1`, or the Prototype dock). With it off, nothing of OSA shows or is called. Its assumed routes, fields and events are in `contract/cr-29-assumed.json`.
- **Focus:** clicking a button or card shows no ring, and the keyboard always shows one (`focus.css`). Text boxes never turn blue on click: focused, the edge darkens, a bright segment runs once around it, the field lifts and a soft grey halo breathes while you type (`taste.css`).
- **The blue is cobalt** (`#2d53ca` text, `#4a76f0` fill; night `#99b9ff` and `#7ba1fc`), set in `notch.css` and `tokens.css`. Primary buttons are tonal: a faint cobalt wash, a greyish-blue outline and a cobalt label, with a sheen on hover.
- **Motion means something** (`taste.css`): one heartbeat for live work, a sweep across the top when an event arrives, a still amber dot when the stream stalls. Nothing loops for decoration, and everything stops under reduced motion.
- **Motion:** view transitions on navigation, list stagger, value changes animate with transform only, everything off under `prefers-reduced-motion` (`motion.css`, `components.md`).
- **Phone:** Decisions and Release must be fast and one-handed. Primary buttons are at least 44px tall; every other target at least 24px. Under 150 KB of JavaScript on first load for Decisions.
- **Type scale** 12, 13, 14, 16, 20, 28 at weights 400 and 500. **Icons** 12, 14, 16, 20 from Lucide.

## What's mock and what's contract

The prototype reads contract 1.0.0 (`packages/contract`, with `docs/design/API routes.md` and "Contract response to CR-W1 to W22"). CR-W1 to W22 are built in 1.0.0, some with changes the contract made; `screens.md` shows each screen's routes by number and what's built.

`npm run build` fails on any route, procedure, query key or event that isn't in 1.0.0. CR-29's names are allowed only from `contract/cr-29-assumed.json`, and a few proposed routes may be named in a gap note but never called (`contract/proposed-routes.json`).

What the contract still lacks is in `cr-list-1-0-0.md`, each with its change request:
- running rooms (Gap 4);
- a client's timeline (CR-W23);
- a title on findings;
- skill roles;
- the roster's inner shape;
- the Library's layer filter, content and template results;
- contract-mock's money labels;
- evidence proofs.

Until a CR lands, the screen shows what `screens.md` names, never invented data.

## Done means

Every screen works against the contract mock, then the real API; stays live through the event stream; handles every error code with a clear sentence and a way out; and Decisions and Release are fast and usable on a phone. The e2e suite in this zip, ported to `apps/web` and run with `APP_URL`, is how you show it. `audit-contract-rules` holds the rules that don't bend: no money, untrusted text as text, all 10 decision kinds, no polling, and a contract check that refuses unknown names.

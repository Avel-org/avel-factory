---
doc: agent-fenn-t-f7-review
ticket: T-F7
lane: frontend
sprint: sprint-07
agent: fenn
seat: checker
kind: review
role: review
rigor: standard
model: sonnet
branch: t/F7-control-room-port
checkout: detached
after: [agent-fantem-t-f7-build]
depends_on: [T-F2]
report: docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review-completion.md
---


# T-F7 · review · Fenn: The control room runs at / from the design export, and the old shell is gone

<!-- Rendered by scripts/render.py from plan.toml. Never edit this file: change the plan, re-render, commit, and start a new attempt. -->

| | |
| --- | --- |
| Lane | frontend · lead Zero |
| Sprint | sprint-07 · Step 1 |
| Ticket | T-F7 · rigor standard |
| Dispatch | review · Fenn (checker) · model sonnet |
| Works on | a detached checkout of `t/F7-control-room-port`'s head |
| Done when | CI is green and the acceptance tests pass. Nothing else (C1, C3). |

## 1. Identity

You are **Fenn** (`.claude/agents/fenn.md`). Lead: Zero. Builder: Fantem. Checker: Fenn.

You review the builder's work on this ticket, from the diff and this document only (G1). You change no code.

## 2. Context: read these first, in order

1. `.claude/agents/fenn.md`: who you are, and your always and never
2. `AGENTS.md`: the rules for the code itself
3. `docs/design/Build rules.md`: how work moves from a ticket to main; cite rules by ID
4. `docs/agent-dispatch/frontend/sprint-07/codebase-analysis.md`: the codebase in short
5. `docs/design/CR-W29 The control room from the design export.md`: what this sprint does, and which rules change for how long
6. `docs/ui-reference/control-room-handoff/README.md`: the export's own handoff: port order, the rules that aren't obvious, what's mock and what's contract
7. `docs/ui-reference/control-room-handoff/screens.md`: every screen, its route and its states
8. `docs/design/CR-W29 The control room from the design export.md`: the whole ticket: where the export lands, what's copied and left out, the two-commit landing, the rules that change
9. `/mnt/c/Users/javar/Desktop/avel-control-room/README.md`: how the export is put together: logic.js, the views, DCLogic, hash routing, the dock
10. `/mnt/c/Users/javar/Desktop/avel-control-room/src/main.jsx`: the entry: the 29 stylesheets in load order and the ControlRoom mount
11. `/mnt/c/Users/javar/Desktop/avel-control-room/src/app/ControlRoom.jsx`: its defaultProps, which React 19 drops for function components
12. `apps/web/src/routes/__root.tsx`: the document the control room mounts in; its stylesheet links
13. `apps/web/e2e/budget.spec.ts`: how the budget is measured today, and why a client-only page would slip past it
14. `apps/web/test/control-room/**`: the locked acceptance tests: they define done
15. `apps/web/e2e/control-room/**`: the locked acceptance tests: they define done
16. `apps/web/e2e/budget.spec.ts`: the locked acceptance tests: they define done
17. `apps/web/test/shell/**`: the locked acceptance tests: they define done
18. `apps/web/e2e/shell/**`: the locked acceptance tests: they define done
19. `apps/web/test/home-loader.test.ts`: the locked acceptance tests: they define done
20. `apps/web/test/home-loader-states.test.ts`: the locked acceptance tests: they define done
21. `apps/web/test/home-view.test.ts`: the locked acceptance tests: they define done
22. `apps/web/e2e/home.spec.ts`: the locked acceptance tests: they define done
23. `apps/web/e2e/states.spec.ts`: the locked acceptance tests: they define done
24. `docs/agent-dispatch/frontend/sprint-07/agent-fantem-t-f7-build-completion.md`: the builder's completion report
25. `docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review.md`: this document: follow it exactly

## 3. Domain

**Goal:** Opening / shows the export's control room, with its sidebar, header and Decisions home, exactly as the export draws it, instead of the shell apps/web built.

**Refs:**
- CR-W29: what, how it lands, decisions 3 to 6, the locked tests that retire
- control-room-handoff/README.md

**Merged before this starts:** T-F2

**Notes from the lead:**
- Commit 1, the copy: the export's src/, contract/ and tools/check-contract.mjs into apps/web/control-room/ at the same relative paths, byte for byte, plus apps/web/control-room/SOURCE.md listing every copied file with its SHA-256 and the export path, and an empty "Changed for apps/web" section. Leave out node_modules, dist, scratch, tests, handoff (already in docs/ui-reference/control-room-handoff), index.html, package.json, package-lock.json, vite.config.js and the prettier files. This commit changes nothing else
- Commit 2 onward, the adaptation, each change as small as it can be, listed in the report, and each changed file named with its reason in SOURCE.md's "Changed for apps/web" section (its listed SHA-256 stays the one copied): mount ControlRoom at / in src/routes/index.tsx with ssr: false and a skeleton until it boots; load the export's stylesheets in main.jsx's order, and only those, at /; move ControlRoom's defaultProps to parameter defaults (React 19); showDock only when import.meta.env.DEV; fix anything else React 19 or Vite 8 refuses, and nothing more
- Remove the old shell: src/kit, src/modules/system, src/home and src/routes/_shell*. Keep src/data/client.ts, src/styles and src/lib/utils.ts as they are (CR-W29)
- New dependency, approved in this ticket list (E5, CR-W29 decision 5): thinking-orbs 0.3.2, pinned exactly, in @avel/web's dependencies; MIT. The lockfile changes only for it. Nothing else is added
- TypeScript: one declaration file, src/control-room.d.ts, types the module the route imports (ControlRoom and its props). tsconfig doesn't include control-room/**, and allowJs stays off. Biome: one override in biome.json leaves apps/web/control-room/** out of formatting and linting (CR-W29, E4), and nothing else in biome.json changes
- The budget (CR-W29 decision 6): at most 350 KB gzipped for / in this ticket. If the build measures more, stop with needs-cr; don't trim the export to fit, because T-F8 does that
- Mark shell-layout.md and kit-v1.9.md as superseded by CR-W29 with one line at the top of each (E7). Change nothing else in them
- If the copy differs from what CR-W29 describes (a file named here is missing, or something not listed needs to run), stop with needs-cr

## 4. Tasks

### T-F7-01: check: First, in its own commit, delete the locked tests CR-W29 retires: T-F2's test/shell/** and e2e/shell/**, and T-F1's home-loader, home-loader-states, home-view, home.spec and states.spec. Name CR-W29 in the commit

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-02: check: unit: apps/web/control-room/SOURCE.md lists every copied file with a 64-hex SHA-256 as copied from the export; the files under apps/web/control-room/ are exactly those (none missing, none extra besides SOURCE.md); each file whose SHA-256 differs from its listed one is named, with a reason, in SOURCE.md's "Changed for apps/web" section; nothing listed is under node_modules, dist, scratch, tests or handoff

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-03: check: unit: @avel/web's dependencies pin thinking-orbs to exactly 0.3.2; no file under control-room/ contains console.log

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-04: check: e2e: at 1280x800, / boots the export: the sidebar, the header and the Decisions home render, with no page error and no console error, and none of T-F2's data-ui="AppShell" frame

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-05: check: e2e: #/ hash routes move between the export's pages without a full reload (a sample: Decisions, Live, Library, Settings), and the browser's back button returns

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-06: check: e2e (budget.spec.ts, changed under CR-W29): everything / loads before the Decisions home is interactive, gzipped, is at most 350 KB, with a warning over 150 KB; scripts fetched after hydration count

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-07: check: e2e: in a production build, the Prototype dock and viewport preview don't render, and nothing of OSA shows without ?osa=1

- Is it built, and does a locked test actually prove it? Cite the test and the code.

### T-F7-R: the rules

- The diff stays inside the build's territory (Part 5) and touches no locked test (A3, H6).
- `AGENTS.md` and the build rules hold (E1 to E18): cite the section a finding breaks.
- No secret anywhere in the diff, tests, logs or report (E6).

## 5. Territory

**You change no file** except your report and findings, both left uncommitted:
- `docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review-completion.md`
- `docs/agent-dispatch/frontend/sprint-07/findings/t-f7-fenn-NN.md`, one per finding

**The build's territory**, for checking the diff:
- `apps/web/control-room/**`
- `apps/web/src/routes/**`
- `apps/web/src/routeTree.gen.ts`
- `apps/web/src/router.tsx`
- `apps/web/src/kit/**`
- `apps/web/src/modules/**`
- `apps/web/src/home/**`
- `apps/web/src/control-room.d.ts`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/package.json`
- `pnpm-lock.yaml`
- `biome.json`
- `docs/ui-contracts/shell-layout.md`
- `docs/ui-contracts/kit-v1.9.md`

**Never change, whatever the task says:**
- `apps/web/src/data/**`
- `apps/web/src/styles/**`
- `apps/web/components.json`
- `apps/web/src/lib/utils.ts`
- `apps/web/test/foundation.test.ts`
- `apps/web/test/gitignore.test.ts`
- `apps/web/test/hygiene.test.ts`
- `apps/web/e2e/support/page.ts`
- `apps/web/e2e/support/ports.ts`
- `apps/web/vitest.config.ts`
- `apps/web/playwright.config.ts`
- `packages/**`
- `packages/**`
- `.claude/**`, `.agents/**`, `docs/agent-dispatch/**` (except your report), `scripts/agents/**`, the kit scripts, `.env*`

## 6. Execution protocol: review

1. You're on a detached checkout of the builder's result. Get the diff: `git diff $(git merge-base main HEAD)...HEAD`.
2. Read the builder's report, then the diff, then the locked tests. You don't see the builder's session (G1).
3. Run Part 7's commands yourself. A red command is a finding.
4. Write each finding to its own file under `findings/`: severity (P0 to P3, G3), evidence (a file and line, a failing command, or a rule ID), what you expected, and the check that would catch it.
5. List what you checked and what you couldn't reach. Leave everything uncommitted.

## 7. Completion

**Verification** (run every one, in order, and paste the results into your report):

```sh
pnpm --filter @avel/web exec vite build
pnpm typecheck
pnpm lint
pnpm --filter @avel/web exec vitest run && pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vitest run
pnpm --filter @avel/web exec playwright test
pnpm --filter @avel/web exec vite build
pnpm --filter @avel/web exec tsc -p tsconfig.json --noEmit
pnpm typecheck
pnpm lint
```

**Your report:** `docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review-completion.md`. Its first lines are:

```
status: done | blocked | needs-cr | test-dispute | needs-dependency | out-of-scope
verdict: pass | changes | block
ticket: T-F7
```

Then these sections:
- Pre-flight: each verification command and its result
- Findings: one line each, with its severity and its file under findings/
- Checked: what you checked, and against which rule
- Not reached: what you couldn't check, and why
- Messages received: every instruction OSA relayed, who it came from, and what you did with it (followed, or refused and why); "None" if there were none (CR-37)

## Activation prompt

> You are Fenn, the frontend checker on the AVEL build team (`.claude/agents/fenn.md`). Your lead is Zero. Your task is ticket T-F7, "The control room runs at / from the design export, and the old shell is gone": the review dispatch. Your whole briefing is `docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review.md`. Read it in full, then its Context in order, before you change anything. You're on a detached checkout of the builder's result. Review the diff against the ticket, the locked tests and the rules. Every finding cites evidence and a severity. If you can't finish inside this ticket, stop with one status: blocked, needs-cr, test-dispute, needs-dependency or out-of-scope. Don't start a new approach on your own. End with your completion report at `docs/agent-dispatch/frontend/sprint-07/agent-fenn-t-f7-review-completion.md`, left uncommitted. Don't push.

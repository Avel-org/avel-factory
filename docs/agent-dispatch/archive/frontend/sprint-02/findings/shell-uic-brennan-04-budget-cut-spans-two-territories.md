status: open
severity: P2
owner: Zero (app-shell.md section 6), INT (the budget call the plan leaves him)

# shell-uic-brennan-04: section 6's conditional cut spans two FM territories, leaves FM's data layer unnamed, and doesn't say what follows if it isn't enough

## What the contract says
- `app-shell.md:243`: "Fantem and Leon report `/`'s first load in their verify, so a rise shows at the build."
- `app-shell.md:244`: "If Leah's final measure is over 150 kB, the cut is … the thin oRPC link (size-study-leah-03, −7.7 kB alone; sprint-01 decisions, 'Further cuts'). It's Ghost's data core plus the decisions module's query keys, under a revision of this contract. It isn't built unless the bar fails."
- `docs/agent-dispatch/frontend/sprint-02/decisions.md:39`: "It comes as a revision and one Ghost dispatch."

## Why it isn't unambiguous

1. **Two territories in one dispatch.** "Ghost's data core plus the decisions module's query keys" is `apps/web/src/data/**` plus `apps/web/src/modules/decisions/**`: two rows of FM's territory table. FM:447 says a dispatch's "territory is still exactly one row of this table". Sprint-01's "Further cuts" table (sprint-01 `decisions.md:560`) costed it the same way: "Ghost (`client.ts`, `errors.ts`, a new `thin-link.ts`), Leon's `api.ts` (manual query keys)".
2. **The shell adds a third caller.** After this sprint, `system`'s `ShellLayout` calls `pendingDecisionsOptions(api)` with `api` from the data core (`app-shell.md:176`). The thin link replaces `createTanstackQueryUtils` and the client's type (size-study-leah-03, "Saving"). If that changes `api`'s type or the options' signature, `apps/web/src/modules/system/**` changes too.
3. **FM's data layer.** FM:192 says "`createTanstackQueryUtils(client)` gives `orpc.<group>.<route>.queryOptions …`. Query keys come from oRPC." FM:30 says "Every read and write goes through the typed oRPC client." The thin link departs from both. Sprint-01's table listed "FM line 30" as a cost. Section 6 doesn't.
4. **The figure.** The −7.7 kB was measured "alone" on the 174.35 kB baseline, before the stub, the compiler and the lazy dialog (size-study-leah-03, "Baseline … 174.35"). On top of the stub it was −8.6. Sprint-01's call was "**W2, measured first**" (sprint-01 `decisions.md:560`). The contract quotes −7.7 as if it applies to today's 149.30 kB.
5. **No rule for "still over".** If the shell adds more than about 8 kB, the cut doesn't bring `/` under 150 kB, and section 6 doesn't say what happens next. It also doesn't say whether sprint-02 may close with `/` over budget on main. Leah measures only after everything is merged (`app-shell.md:285-286`). `decisions.md:40` leaves the budget for the shell era to INT, and that call is still open.
6. **Who reports the number.** Line 243 names Fantem and Leon. `codebase-analysis.md:37` says "Every build reports it." Ghost's build also changes `/`'s JavaScript (`loadReasonDialog` instead of the deep import, and `ScreenHeader`).

## Fixing it means
- **The dispatches the cut takes, by FM row:**
  - Ghost on `data/**`;
  - the decisions module's builder on `modules/decisions/**`;
  - Leon on `modules/system/**` if the badge's call changes.
- **The departure:** name the FM data-layer departure (FM:30 and FM:192) that the revision would make.
- **The figure:** quote it as "−7.7 alone on the 174.35 kB baseline, −8.6 on the stub; not measured on today's main".
- **The rule if it's still over:** INT's call, with sprint-02 closing or not.
- **Who reports:** one rule. Either every build that changes `/`'s JavaScript reports the number (Ghost included), or `codebase-analysis.md` matches line 243.

# Bottleneck audit — Control Room

Nov 14, 2026 · the JSX prototype on sample data (mock-up) · measured with Playwright at 1440×900 and 390×844

The question was: where does the Control Room make you wait, read, type or tap more than the decision needs, and where does it leave you with nothing to tap at all? Every main flow was walked: Decisions, starting a project, Scope (0.1 to Finalize), Build and modules, findings, release and receipt, clients, the Library and Settings. Each was measured for taps, typing, waiting, forced reading, where the answer button sits on screen, and buttons that lead nowhere.

## What was found, ranked

Ranked by how often it costs you and how much. "Fixed" means fixed in the prototype today with no contract change. "CR" means it needs CR-W28.

| # | Bottleneck | Where | Cost before | Status |
| --- | --- | --- | --- | --- |
| B4 | **Starting a project led nowhere.** "Start Canon" waited 1.6 s, showed a toast and left you on the form. "Start the interview" on a draft project only showed "designed in the next pass". | New project; any draft project | Onboarding couldn't begin from the app at all | **Fixed.** Start Canon creates the project and opens Canon's interview on it. The first question (client project, internal tool or template) is waiting, and the first thing you say drafts the brief's Problem. A draft's "Start the interview" does the same. |
| B1 | **The next decision arrived out of sight.** After you decided a long item, the next one's title sat 376 px above the screen, and focus fell back to the page. | Decisions, laptop | A scroll back up on 5 of the first 6 decisions; keyboard users lost their place | **Fixed.** The next item's title is brought into view and takes focus. |
| B2 | **Answer buttons below the fold.** On a long item the buttons sat at 1006 px on a 900 px screen. | Decisions, laptop | A scroll down before every long decision | **Fixed.** The answer bar stays at the bottom of the screen while the item is in view, like the phone's pin. |
| B3 | **A pass approval was a round trip.** Release said "Review the pass", sent you to Decisions, and you came back to release. | Release | Two page changes and a re-find, in the flow that ships to a client | **Fixed.** You accept the pass beside Release: the same decision record, with its reason box. Decisions clears too. |
| O1 | **A clean 0.2 still looked like work.** With every check passing and Brennan's finding settled, 0.2 read "Approve 0.2 Breakdown" with the same evidence as a flagged one. | Decisions, Scope | You re-read the breakdown to be sure | **Fixed (Option 1).** It reads "0.2 Breakdown for Fleet portal is clean", with a Clean tag and a short summary: checks, Brennan's review, questions, plan size. It's one tap. Scope's approve bar says the same. The server should send the summary: CR-W28 §1. |
| B5 | **"Rewrite a section" did nothing.** It sat on every checkpoint's approve bar and only showed "designed in the next pass". | Scope | The only way to change a checkpoint was hidden | **Fixed.** Renamed "Ask Canon for a change". It opens the interview line with "In 0.2 Breakdown, change " typed and the cursor ready: a rewrite is one sentence to Canon. |
| B6 | **The module page's waiting card showed a raw ID and left the page.** It read `proposal:01a1b01a-…` and went to Decisions, though the same ask is answerable in the trail below. | Build › module | Forced reading of an internal id, then a page change | **Fixed.** It shows the title only and jumps to the ask in the trail, with focus on its first button. |
| B7 | **Two reasons for one accepted finding.** Accepting a finding needs a reason (route 60). The pass that finding causes asks for a reason again. | Findings → Release | The same sentence typed twice before a release | **CR-W28 §2.** The pass carries the accepted findings and their reasons, and asks for none when they explain every cap. |
| B8 | **Scope's "Accept with a reason" asks for no reason.** The contract requires one (route 60), so the real API adds a step the prototype hides. | Scope › 0.2 rubric | Hidden typing the operator will meet later | **Open.** Ask for it inline, once. CR-W28 §2 then reuses it at release. |
| B9 | **Phone Scope: approve lives on the Brief tab.** Answering the last question in Interview doesn't show that the checkpoint can now be approved. | Scope, phone | A tab switch to find out | **Open.** Recommend a "Ready to approve" mark on the Brief tab. |
| B10 | **Buttons that still lead nowhere** ("designed in the next pass"): Add a file and Add files first, the Library's four "New…" items, the template actions (start a project from it, propose a change, new version), Run doctor, Sign out, and the error panel's Pause and Cancel. | Scope, Library, Templates, Settings, errors | A tap with no result | **Open.** The routes exist in 1.0.0 except doctor's shape (CR-W28 §3); these are screens still to design. |
| B11 | **"Check the proof" is below the fold** on the release and receipt pages (882 px on a laptop, 1000 px on a phone). | Release, Receipt | A scroll, for an optional step | Low. Left as is: the check is optional and takes about a second. |

## What's not a bottleneck

- **Waiting between decisions:** 0.5 s on every item, the exit animation. No item made you wait more than a second.
- **Clearing the whole queue** (15 items, taking every recommended answer): 15 taps, one reason typed (the pass approval), about 9 s on a phone. Nothing else asks for typing.
- **Approvals never ask for a password.** Step-up applies to credential actions only.
- **No polling.** The only timer that checks anything is the stall check; the rest are on-screen clocks or the mock replaying a stream.
- **Undo** holds a decision for 6 s without blocking the next one.

## Before and after

| Measure | Before | After |
| --- | --- | --- |
| New project to Canon's first question | Not possible (toast) | 1 tap, 0.5 s |
| Next decision's title after deciding (laptop) | 376 px above the screen | In view, focused |
| First answer button on a long item (laptop) | 1006 px of 900 | 840 px, always on screen |
| Accepting a pass and releasing | 2 page changes, 4 taps, 1 reason | 0 page changes, 2 taps, 1 reason |
| Approving a clean 0.2 | Read the breakdown, 1 tap | 1 tap, marked Clean |
| Changing a checkpoint | No way (dead button) | 1 tap, then one sentence |

## Where it lives

- Option 1: `cleanSummary()` in `src/app/canon.js`; the checkpoint decision in `src/app/logic.js` (`checkpointDecs`); the Clean tag and link in `src/pages/decisions/DecisionsPage.jsx`; `.cv-clean` on Scope.
- B1, B2: `DecisionsPage.jsx` (focus and scroll on a new item), `.cr-hero-foot` sticky in `src/styles/crew.css`.
- B3: `releaseVals` in `src/app/operations.js`, the release bar in `src/pages/operations/OpsPages.jsx`.
- B4: `startInterview()` and `createMission()` in `logic.js`; `freshOnboarding()` and `freshQuestions()` in `canon.js`; `withAudience` now reads only the project's own questions (it used to pick up another project's Q-0.1a answer).
- B5: `rewrite` in `canon.js`, the `compose.first` starter in `src/pages/project/CanonDock.jsx`.
- B6: `src/pages/operations/ModulePage.jsx`.
- Kept honest by `tests/e2e/flow-bottlenecks.cjs`.

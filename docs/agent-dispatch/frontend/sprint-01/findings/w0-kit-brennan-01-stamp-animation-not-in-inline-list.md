status: fixed (8cb66a7)
severity: P3
owner: Zero (UI contract, section 4)

# w0-kit a2, Brennan 01: section 4's "What stays inline" list leaves out D12's stamp animation, which the locked UC-08 needs inline

## Evidence
- **The code:** `apps/web/src/kit/DecisionTag.tsx:357` at d3535b1 (commit 4f0cf1c) keeps one inline declaration on the stamp: `style={{ animation: "av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both" }}`. Every other stamp value is in `apps/web/src/kit/kit.css:921-934`.
- **The locked test:** `apps/web/test/kit/decision-tag.test.tsx:95-97` (UC-08, locked as w0-kit · 965071b) asserts `expect(card.outerHTML).toContain("--av-d-punch")`. A rule in a linked stylesheet can't show up in the element's HTML.
- **The contract:** `docs/ui-contracts/decisions-approval-page.md` section 4, "The kit's styles", "What stays inline". It allows inline style "for the values the locked kit tests read from the element", then lists only D11's phone grid and D6's stale strike.
- **Command (at d3535b1):**
  ```
  $ grep -n "style=" apps/web/src/kit/*.tsx
  apps/web/src/kit/DecisionTag.tsx:197:            style={{
  apps/web/src/kit/DecisionTag.tsx:298:              style={state === "stale" ? { textDecoration: "line-through" } : undefined}
  apps/web/src/kit/DecisionTag.tsx:357:          style={{ animation: "av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both" }}
  ```

## Ruling
The build is right. It follows the contract's governing rule (values the locked tests read stay inline), and Fantem reported it as Deviation 1, as the task's notes required. The list after the rule is incomplete. This isn't a defect in the kit, and the locked test doesn't change.

## What fixing it means
Zero adds D12's stamp animation (`animation: av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both`) to section 4's "What stays inline" list, beside D11 and D6, in the next contract revision. No code change. If Fenn's UC-29 inline-selector count (Decisions, "Revision 7": part of Fenn's fix round) counts the kit's inline styles, it needs to allow for this third one.

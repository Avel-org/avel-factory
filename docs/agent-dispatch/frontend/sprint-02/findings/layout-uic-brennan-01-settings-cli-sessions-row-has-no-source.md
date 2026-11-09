status: open
severity: P2
owner: Zero (shell-layout.md sections 3 and 5), then Fantem (Icon) or Leon (Settings), depending on the fix

# layout-uic-brennan-01: Settings' CLI sessions empty state has no data, no icon in the kit, and no defined test

## What the contract says
- `shell-layout.md:135`, Settings: lead `Theme, depth and your CLI sessions.`†; content "The Theme and Depth groups"; empty state `key-round`, `No CLI sessions`†, `A session appears here when you sign in with the avel CLI.`†
- `shell-layout.md:128`: "Each page is `ScreenHeader`, its content, and then `WidgetState` `empty` (with no action) when there's nothing to show."
- `shell-layout.md:116`: `_shell`'s loader awaits routes 52, 19 and 8. No other read is named for Settings.
- `shell-layout.md:84`: `Icon` adds `menu`, `plus`, `panel-left`, `chevron-right`, `sun`, `moon`, `square`, `layers`, `loader`, `x`, and section 4's nav icons. `key-round` isn't one of them, and it isn't a nav icon.
- `shell-layout.md:189`, SH-11: "Section 5's pages, empty and with rows; Settings' groups".

## Why the build can't follow it
1. **No data source.** CLI sessions are route 4 (`GET /api/cli/sessions`, `docs/design/API routes.md:26`; `packages/contract/src/routes/auth.ts:39`). Nothing in the contract reads it: not `_shell`'s loader, not Settings. The mock dispatch serves routes 19 and 8 only (task doc Part 3: "The contract mock serves route 19 … and route 8"). So the row has two possible builds, and both are wrong:
   - **Always drawn:** the page says `No CLI sessions` to an operator who has sessions. That's a stub, which Int's brief rules out ("Real pages with empty states, no stubs"), and it states something the server never said (FM, Layers: "displayed, never computed").
   - **Never drawn**, because Theme and Depth always show, so there's never "nothing to show": the row, its icon and its copy are dead, and the lead promises CLI sessions the page doesn't have.
2. **The icon isn't in the kit.** `IconName` is a closed union (`apps/web/src/kit/Icon.tsx:51`, `keyof typeof ICONS`, and the registry at lines 27 to 47 has no `key-round`). Fantem builds `Icon` from section 3's list, which leaves it out. Leon's Settings would then fail typecheck, and Leon can't edit `kit/**` (his Part 5). DL does register it (`"key-round":PA` in the bundled icon map), so the icon itself is fine. It's just missing from section 3.
3. **SH-11 is undefined for Settings.** "Empty and with rows" needs rows of CLI sessions. There's no fixture and no route in the mock to supply them.

## Evidence
```text
$ grep -n 'key-round\|CLI' docs/ui-contracts/shell-layout.md
135:| Settings (system) | `Factory`, `Settings`, `Theme, depth and your CLI sessions.`† (S15) | The Theme and Depth groups (below) | `key-round`, `No CLI sessions`†, `A session appears here when you sign in with the avel CLI.`† |
$ grep -n 'key-round' apps/web/src/kit/Icon.tsx
$ (no match)
```

## What fixing it means
Choose one, in section 5 (and section 3 if needed):
- **(a) Drop the row for sprint-02.** Remove the Settings empty state, and change the lead to Theme and Depth only (for example `Theme and depth.`†). CLI sessions come with route 4's slice. This is the smallest fix, with no new mock route and no icon. Recommended.
- **(b) Build it.** Add route 4 to the mock with a fixture, add the read to Settings (or `_shell`), add `key-round` to section 3's icon list, and say in SH-11 what Settings' "empty and with rows" means.

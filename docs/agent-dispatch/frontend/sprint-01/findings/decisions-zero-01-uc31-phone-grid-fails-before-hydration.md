status: open
severity: P1
owner: Fantem (kit.css: D11's phone grid as a CSS rule) and Zero (contract section 4, D11 and "What stays inline"), per INT's decision. Not Leon's code.

# UC-31 (locked) fails on the phone: the server draws the desk actions, and the test reads the grid before hydration

**What the task asks.** ZERO-01's verify runs `pnpm --filter @avel/web exec playwright test`, and the expected result is "all locked tests pass".

**What happens.** Run at d480f0e:
```
$ pnpm --filter @avel/web exec playwright test
  ✓  1 [phone] UC-29 ...
  ✓  2 [phone] UC-30 ...
  ✘  3 [phone] UC-31: on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px (229ms)
  ✓  4 [desk] UC-29 ...
  ✓  5 [desk] UC-30 ...
  -  6 [desk] UC-31 ...
    Error: expect(received).toBe(expected)
    Expected: "grid"
    Received: "flex"
      > 125 |   expect(grid?.display).toBe("grid");
  1 failed, 1 skipped, 4 passed
```

**Why.**
- `apps/web/src/modules/decisions/screens/DecisionsScreen.tsx:135-141`: `useIsPhone()` has the server snapshot `() => false`, so the server's HTML always has `layout="desk"`. The browser switches to `phone` only after hydration.
- `apps/web/src/kit/DecisionTag.tsx:125,193-203`: D11's two-column grid is drawn only for `layout === "phone"`, as an inline style.
- `apps/web/e2e/decisions.spec.ts:104-135` checks the grid before lines 139-140 wait for `data-hydrated`.

Section 5 ("Phone") says only "On a phone, tags use `layout="phone"`". It doesn't say how the server's HTML knows the viewport, so Leon's code doesn't break the contract. The gap is in the contract and the kit.

**Fixing it means** (INT has chosen this): D11's phone grid becomes a `kit.css` rule under `@media (max-width: 899px)`, so the server's HTML is right on a phone. Section 4's "What stays inline" and D11 change with it. Then UC-31 passes unchanged, with no change in `apps/web/src/modules/decisions/**`.

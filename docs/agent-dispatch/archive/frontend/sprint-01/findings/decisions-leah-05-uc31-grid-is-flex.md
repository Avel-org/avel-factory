status: fixed (D11, 193a66f; UC-31 a4, 1c2213d)
severity: P2
owner: INT (known: D11's grid becomes a kit.css rule; Fantem)

# UC-31 fails: the phone actions are `display: flex`, not D11's two-column grid

```
$ pnpm --filter @avel/web exec playwright test
  ✘ [phone] UC-31   Expected: "grid"  Received: "flex"  (decisions.spec.ts:125)
  4 passed, 1 skipped
```
The container is `.av-dt-actions-phone` in the kit (`kit.css:906`), and Leon's `decisions.css` deliberately doesn't size kit targets. Heights are not in doubt (Approve/Reject are `Button`s under K1's 44px `min-height`), but the two-column layout isn't there. The UC-31 hydration wait sits after its grid check, as INT notes; not a defect in the page. **Fix means:** a `kit.css` rule `display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px` on `.av-dt-actions-phone` (D11).

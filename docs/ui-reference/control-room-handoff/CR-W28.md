# CR-W28 — One tap when it's clean

**Status:** proposed, Nov 14 · **Contract:** 1.0.0 → 1.1.0 (additive) · **Screens:** Decisions, Scope (Canon), Release, Settings

The bottleneck audit (`claude/Bottleneck audit — Control Room.md`) found three places where the operator reads or types something the server already knows. The web works around two of them today by computing from the draft; the server should send the answer so the screens can't drift from the record.

## 1. A clean checkpoint says so (Option 1)

A checkpoint is **clean** when no code check fails, every reviewer finding is settled (fixed, or accepted with a reason), and no question that blocks it is open. A clean checkpoint is approved in one tap with nothing to read. Only a flagged one needs the full review.

Add to `CheckpointDecision.target` (and `MissionDetailDto.checkpoints[]`):

```ts
summary: z.object({
  clean: z.boolean(),
  checks: z.object({ pass: z.int(), advisory: z.int(), fail: z.int(), total: z.int() }),
  review: z.object({ by: z.string(), findings: z.int(), settled: z.int() }),   // "Brennan", 1, 1
  openQuestions: z.int(),
  modules: z.nullable(z.int()), waves: z.nullable(z.int()), tests: z.nullable(z.int()),  // 0.2 only
})
```

- `clean` is computed on the server from the same rubric the checkpoint page shows. The web never decides cleanliness on its own once this ships.
- `reasonRequired.approve` stays false. Asking for changes still needs a reason, because Canon needs to know what to change.
- Event: `onboarding.checkpoint.changed` already carries the checkpoint; it gains `summary`.

**Today:** `cleanSummary()` in `src/app/canon.js` computes the same object from the mock draft. It's used for 0.2 only.

## 2. One reason per accepted finding, not two

Accepting a finding needs a reason (`AcceptFindingInput.reason`, route 60). That finding is what caps the verdict at pass, and approving the pass then asks for a reason again (`PassApprovalDecision.reasonRequired.approve`). The operator ends up writing the same sentence twice.

Add to `PassApprovalDecision.target`:

```ts
acceptedFindings: z.array(z.object({ findingId: Uuid, ref: z.string(), title: z.string(), reason: Reason })),
```

and make `reasonRequired.approve` false when every entry in `verdictCaps` comes from a finding in `acceptedFindings`. The release record links those reasons. If a cap has another cause, the pass still asks why.

**Today:** the prototype still asks for the reason on the pass, as 1.0.0 requires. The pass can now be accepted on the Release page (B3), so at least it's one screen.

## 3. Doctor has a shape

`DoctorDto` (route 7) is all `Placeholder`. Settings' "Run doctor" has nothing to render, so it's a dead button. Proposed:

```ts
DoctorCheck = z.object({ key: z.string(), state: z.enum(["ok", "warn", "fail"]), plain: PlainShort, checkedAt: IsoTime })
DoctorDto = z.object({ checks: z.array(DoctorCheck), roomHealth: z.array(z.object({ slot: z.int(), state: z.enum(["ok","warn","fail"]), plain: PlainShort })) })
```

Token checks report expiry dates and an account owner's name only, never a value.

## Not in this CR

- New project → interview (B4) and "Start the interview" on a draft use routes 20 and 34 as they are.
- "Ask Canon for a change" (B5) is a turn on route 34.
- Uploads (route in `gate0`), library create (routes 75, 79, 83, 87) and template actions exist in 1.0.0. Their screens are a design pass, not a contract gap.

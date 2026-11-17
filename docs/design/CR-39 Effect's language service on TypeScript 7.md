# CR-39: Effect's language service on TypeScript 7 (accepted)

Nov 17, 2026 · drafted by Axis for @javaris · touches `packages/server/package.json`, `pnpm-lock.yaml`, `packages/server/tsconfig.json`, CI, the locked test T-B0-08, `CR-30` section 2 and `Outside sources and what we took.md`

**Accepted Nov 17 by the operator:** decisions 1 and 2, with E5 approval for `@effect/tsgo` 0.64.1. Decision 3 is rejected. Built next cycle as T-B2 (`docs/agent-dispatch/backend/sprint-02/plan.toml`).

## In short

- **What:** replace `@effect/language-service` 0.87.5 with `@effect/tsgo` 0.64.1, and run it in CI. This is the next cycle's one lockfile change.
- **Why:** `AGENTS.md` (Writing Effect, rule 9) and CR-30 (section 5, item 9) say Effect's language service runs in the editor and in CI. The repo uses TypeScript 7.0.2, and `@effect/language-service` refuses it. T-B0's build found this and stopped with `needs-cr` (Soap's report, commit 62dfeb1):
  ```
  ERROR TypeScriptFoundIsNot5Or6: @effect/language-service supports TypeScript 5.x and 6.x;
  for TypeScript 7.x and forward use @effect/tsgo ...
  ```
- **Until then (Javaris, Nov 17, option A):** T-B0 merges as built. `@effect/language-service` stays installed at 0.87.5 but nothing runs it, so **rule 9 isn't met this cycle.** No server code depends on the package, so nothing breaks in the meantime. T-B1 is reviewed by hand against the Writing Effect rules, without the language service.
- **Not taken:** running a TypeScript 5 or 6 compiler beside 7 only for the language service. It would mean a second compiler in the lockfile and editor checks that type differently from the build.

## 1. The package (E5)

| | |
| --- | --- |
| Package | `@effect/tsgo` 0.64.1, dev only, in `packages/server` |
| Licence | MIT |
| Published | Nov 2, 2026: the newest version at least two weeks old on Nov 17 |
| Size | about 11.3 MB, plus one platform binary from its optional dependencies (only the host's is installed) |
| Binary | `effect-tsgo` |
| Replaces | `@effect/language-service` 0.87.5, which is removed from the lockfile |
| Why it | The old package's own error names it as the successor for TypeScript 7 |

## 2. The change

| Where | Change |
| --- | --- |
| `packages/server/package.json` | Remove `@effect/language-service`, add `@effect/tsgo` 0.64.1 at an exact version. Add a script that runs `effect-tsgo` over `src` and `test` and exits non-zero on a diagnostic |
| `pnpm-lock.yaml` | The one lockfile change of the cycle (E5) |
| `packages/server/tsconfig.json` | Whatever plugin entry `@effect/tsgo` needs for the editor, if any. The ticket reads the package's README and states what it added |
| CI (`.github/workflows/ci.yml`) | A step that runs the server's new script, so rule 9's "and CI" holds. `.github/**` is a CODEOWNERS path, so Javaris merges this ticket |
| `tools/repo-checks/test/dependencies.test.ts` (T-B0-08, locked) | `@effect/language-service: "0.87.5"` becomes `@effect/tsgo: "0.64.1"`. Rigg makes the change in the ticket's tests dispatch (F2: only the checker changes a locked test, in its own commit), and the new line is locked as usual |
| `CR-30`, section 2 | `@effect/language-service` becomes `@effect/tsgo`, with a note pointing to this CR. CR-30 is accepted, so this is a note, not a rewrite |
| `Outside sources and what we took.md` | The Effect entry names `@effect/tsgo` for the language service |
| `AGENTS.md` | No change: rule 9 names no package |

## 3. How it's built

One ticket in Axis's lane, standard rigor, about 45 minutes, and the cycle's only dependency ticket.

- **Tests (Rigg):**
  - T-B0-08 gets the new pin.
  - A new test: the server's language-service script exits non-zero on a fixture with a known Effect mistake, such as a floating `Effect` that is never run, and exits zero on clean code.
- **Build (Soap):** the manifest, lockfile, tsconfig and CI step.
- **Stop rule:** if `effect-tsgo` can't run on TypeScript 7.0.2 either, or can't be driven from the command line for CI, Soap stops with `needs-cr` and doesn't pin anything older.

## 4. Risks

- **A young package.** `@effect/tsgo` follows TypeScript 7's native compiler, which is newer than the old language service. If its checks miss a mistake the old package caught, review (G) still covers the Writing Effect rules, as it does this cycle.
- **A platform binary.** CI and every dev machine install the binary for their own platform through optional dependencies. Installs that skip optional dependencies (`--no-optional`) would break the script, and the repo doesn't use them.

## Decisions

1. **Accepted Nov 17:** replace `@effect/language-service` with `@effect/tsgo` 0.64.1 next cycle, as the cycle's one lockfile change, with E5 approval for the package.
2. **Accepted Nov 17:** run it in CI as well as the editor, as rule 9 says.
3. **Rejected Nov 17:** a TypeScript 5 or 6 compiler beside 7 only for the language service.

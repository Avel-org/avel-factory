# CR-32: The skill library follows the Agent Skills spec (accepted)

Nov 14, 2026 · @javaris · lands in the skills step (Step 12); nothing changes in Step 1

**Accepted Nov 14** with the recommendations: `allowed-tools` is refused, and AVEL's metadata keys use the `avel-` prefix.

- **What:** every skill in the factory repo is a valid [Agent Skills](https://agentskills.io/specification.md) folder, checked in the factory repo's CI with the spec's reference validator (`skills-ref validate`) plus AVEL's own checks. AVEL's own fields go in the spec's `metadata` map.
- **Why:** the design already uses `SKILL.md` folders (Design Main, Skills; Port inventory, "Skills"). Following the open spec exactly means:
  - a malformed skill can't merge;
  - the same skill loads in any skills-compatible agent, which CR-5 (one adapter per vendor) and Retry 3 on another vendor need;
  - imported skills come in a known shape, ready for CR-W16's license and eval rules.
- **Touches:**
  - Design Main, Skills: the file format and the factory repo's checks.
  - DATABASE.md, `skills`: one new CHECK, `skills_slug_format_ck` (below), in a migration with the skills step.
  - The factory repo: its CI workflow and a `skills/` layout.
  - Contract: none. Routes 74 to 77 and 115 are unchanged.

## How AVEL's skill maps onto the spec

| Spec field | AVEL rule | Stored in |
| --- | --- | --- |
| Folder name and `name` (required: 1 to 64 characters, lowercase letters, digits and single hyphens, matching the folder) | The skill's slug. One folder per slug; versions are commits, not folders | `skills.slug` |
| `description` (required, up to 1024 characters) | Says what the skill does and when to use it. Agents see only this until the work calls for the skill | The file |
| `license` | Required on an import (already enforced by `skills_import_license_ck`); AVEL's own skills say `Proprietary` | `skills.license` |
| `metadata` (string to string) | AVEL's keys, prefixed `avel-`: `avel-layer` (role, stack, domain), `avel-type` (knowledge, capability), `avel-version`, `avel-version-range` (for example `tailwind@4`), and for imports `avel-upstream-ref` and `avel-edition-note` | `skills.layer`, `type`, `version`, `version_range`, `upstream_ref`, `edition_note` |
| `compatibility` | Informational only. A room's real environment is its pinned image digest | Not stored |
| `allowed-tools` (experimental in the spec) | **Refused.** A skill can never add a tool or permission (Design Main). An imported skill that has it is taken in with the field removed, and the removal is noted in `avel-edition-note` | Not stored |

**Not in the file, on purpose:** `content_sha256` (the indexer computes it at the merged commit), `author` and `source` (taken from the PR or the import, never from what the file claims), and `status` (only you retire a skill).

## The folder

```
skills/<slug>/
├── SKILL.md       # frontmatter + instructions; aim for under 500 lines
├── references/    # pinned library docs for the version range (rooms can't browse)
├── scripts/       # run only inside a room, never on the host
└── assets/        # templates, examples
```

References stay one level deep from `SKILL.md`, as the spec recommends.

## The factory repo's checks (CI, on every PR)

1. `skills-ref validate skills/<slug>` passes for every changed skill. The validator is pinned to a commit of `agentskills/agentskills`.
2. The folder name, `name` and the slug agree, and the slug matches `^[a-z0-9]+(-[a-z0-9]+)*$` with at most 64 characters.
3. `allowed-tools` is absent.
4. Every `avel-` key is one of the known keys, and `avel-layer` and `avel-type` are set.
5. An import has `license`, `avel-upstream-ref` and a `source_url` in its import record.
6. Every relative path `SKILL.md` references exists.
7. A `SKILL.md` over 500 lines is a warning, not a failure.

## The database change

`skills_slug_format_ck`: `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 64`, so a slug that isn't a valid spec name can't be indexed even if CI is bypassed. It gets its generated test like every other rule. It ships in the skills step's migration, not now.

## Delivery: unchanged

Approved skills are still mounted read-only at `/avel/skills`, loaded by name through the SDK's plugin option with setting sources off, and hashed into `skills_sha256`. `skill_read` stays for another vendor's harness.

## Tests ("done when")

- A skill whose folder and `name` differ fails the factory repo's CI.
- A skill with `allowed-tools` fails CI.
- An import without `license` fails CI, and inserting it without one is refused by `skills_import_license_ck`.
- Inserting a slug with an uppercase letter or a double hyphen is refused by `skills_slug_format_ck`.
- A valid skill passes `skills-ref validate` and is indexed with its `avel-` metadata in the right columns.

## Your decisions

- [x] Accept CR-32 (Nov 14).
- [x] Refuse `allowed-tools` (Nov 14).
- [x] The `avel-` key prefix for AVEL's metadata (Nov 14).

status: closed
severity: P3
module: m0-workspace
reviewer: axis (review-backend)
route to: INT (run one command)

# ATLAS-03's verify, the action-validator check of `.github/workflows/ci.yml`, has never been run

## What's wrong
ATLAS-03's verify is `pnpm dlx @action-validator/cli .github/workflows/ci.yml` (`plan.toml:114`; Atlas's task doc, line 76). The permission check denied it in Atlas's session (Atlas's completion report, lines 6, 28 and 61), and it denied it again in this review session. So no schema validator has checked the workflow, and it hasn't run on GitHub yet.

What I did check, in place of the validator:
- I read `.github/workflows/ci.yml:1-57` in full;
- I parsed it with `python3 -I` and `yaml.safe_load`;
- I ran its four commands locally against a real Postgres.

I found nothing wrong. The `postgres:17-alpine` service and its `avel`/`avel`/`avel` credentials match `scripts/pg-local.sh:21` and `:23`. `DATABASE_URL` points at the service's published port 5432. The steps run `pnpm install --frozen-lockfile`, then build, typecheck, lint and test, which are the plan's `[commands]`. This is a missing check, not a known defect, and that's why it's P3.

## Evidence
```
$ pnpm dlx @action-validator/cli .github/workflows/ci.yml
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Code from External].

$ python3 -I -c '<yaml.safe_load of ci.yml>'
triggers {'push': {'branches': ['main']}, 'pull_request': None}
image postgres:17-alpine env {'POSTGRES_USER': 'avel', 'POSTGRES_PASSWORD': 'avel', 'POSTGRES_DB': 'avel'} ports ['5432:5432']
job env {'DATABASE_URL': 'postgres://avel:avel@127.0.0.1:5432/avel'}
runs ['actions/checkout@v4', 'pnpm/action-setup@v4', 'actions/setup-node@v4', 'pnpm install --frozen-lockfile', 'pnpm build', 'pnpm typecheck', 'pnpm lint', 'pnpm test']
parse exit 0
```
Breaks: ATLAS-03's expected result, "the workflow validates", which no one has observed.

## What fixing it means
INT runs `pnpm dlx @action-validator/cli .github/workflows/ci.yml` on the host and records the output here.
- **Exit 0:** set `status: closed`.
- **Any error:** it becomes an Atlas fix in `ci.yml`.

The first green run of the workflow on GitHub would also close this.

## Resolution (INT, 2026-11-06)
Accepted by Int for now: the validator is run later by Int. The workflow is checked only by parsing and by its steps passing locally (Atlas a1, Axis review a1).

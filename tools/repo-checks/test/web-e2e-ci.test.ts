import { describe, expect, test } from "vitest";
import { readRepoFile } from "./helpers.ts";

// T-F11: the web's end-to-end tests run in CI. ci.yml is read as text (no YAML parser, as in
// workflow.test.ts). Comment lines are dropped first, so a comment can't satisfy or break a check.

const E2E_NAME = "web e2e (Playwright)";

function workflowText(): string {
  return readRepoFile(".github/workflows/ci.yml")
    .split("\n")
    .filter((l) => !l.trim().startsWith("#"))
    .join("\n");
}

// Splits the `jobs:` section into its jobs: a job starts at a line indented two spaces.
function jobs(): Map<string, string> {
  const text = workflowText();
  const at = text.search(/^jobs:\s*$/m);
  const body = at === -1 ? "" : text.slice(at).split("\n").slice(1).join("\n");
  const out = new Map<string, string>();
  let key: string | undefined;
  let buf: string[] = [];
  const flush = () => {
    if (key !== undefined) out.set(key, buf.join("\n"));
  };
  for (const line of body.split("\n")) {
    const m = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (m) {
      flush();
      key = m[1];
      buf = [];
    } else buf.push(line);
  }
  flush();
  return out;
}

function e2eJob(): string {
  const found = [...jobs().values()].filter((b) => b.includes(`name: ${E2E_NAME}`));
  expect(found, `ci.yml needs one job named "${E2E_NAME}"`).toHaveLength(1);
  return found[0] as string;
}

// One entry per step: the step's lines, from its "- " to the next step.
function steps(job: string): string[] {
  const out: string[] = [];
  for (const line of job.split("\n")) {
    if (/^ {6}- /.test(line)) out.push(line);
    else if (out.length > 0 && /^ {7,}\S/.test(line)) out[out.length - 1] += `\n${line}`;
  }
  return out;
}

function indexOfStep(list: string[], re: RegExp): number {
  return list.findIndex((s) => re.test(s));
}

describe("T-F11: the web's e2e tests run in CI", () => {
  test("T-F11-01: a job installs, builds, installs Chromium with its dependencies, then runs playwright test", () => {
    const list = steps(e2eJob());
    const install = indexOfStep(list, /run:\s*pnpm install --frozen-lockfile\s*$/m);
    const build = indexOfStep(list, /run:\s*pnpm build\s*$/m);
    const browser = indexOfStep(
      list,
      /run:\s*pnpm --filter @avel\/web exec playwright install --with-deps chromium\s*$/m,
    );
    const test_ = indexOfStep(list, /run:\s*pnpm --filter @avel\/web exec playwright test(\s|$)/m);
    expect(install, "pnpm install --frozen-lockfile").toBeGreaterThanOrEqual(0);
    expect(build, "pnpm build").toBeGreaterThanOrEqual(0);
    expect(browser, "playwright install --with-deps chromium").toBeGreaterThanOrEqual(0);
    expect(test_, "playwright test").toBeGreaterThanOrEqual(0);
    expect(install).toBeLessThan(build);
    expect(build).toBeLessThan(browser);
    expect(browser).toBeLessThan(test_);
    const job = e2eJob();
    expect(job).toMatch(/uses:\s*actions\/checkout@/);
    expect(job).toMatch(/uses:\s*pnpm\/action-setup@/);
    expect(job).toMatch(/uses:\s*actions\/setup-node@/);
    expect(job).toMatch(/node-version:\s*22\s*$/m);
    expect(job).toMatch(/cache:\s*pnpm\s*$/m);
    expect(job).toMatch(/runs-on:\s*ubuntu-24\.04\s*$/m);
    expect(job).not.toMatch(/^\s+services:/m);
  });

  test("T-F11-02: it runs on pull_request and push to main, and a red test makes the job red", () => {
    const text = workflowText();
    const on = /^on:\s*\n((?: {2}.*\n?|\s*\n)+)/m.exec(text)?.[1] ?? "";
    expect(on).toMatch(/^ {2}pull_request:/m);
    expect(on).toMatch(/^ {2}push:\s*\n\s+branches:\s*\[main\]/m);
    const job = e2eJob();
    // No job-level `if:` (four spaces); a step's `if: always()` sits deeper.
    expect(job).not.toMatch(/^ {4}if:/m);
    expect(job).toMatch(/timeout-minutes:\s*30\s*$/m);
    expect(job).not.toMatch(/continue-on-error/);
    expect(job).not.toMatch(/\|\|/);
    expect(job).not.toMatch(/--retries/);
    expect(job).not.toMatch(/PLAYWRIGHT_RETRIES|retries/i);
    const runLine = /run:\s*(pnpm --filter @avel\/web exec playwright test[^\n]*)/.exec(job)?.[1];
    expect(runLine, "a playwright test step").toBeDefined();
  });

  test("T-F11-03: it uploads apps/web/test-results with actions/upload-artifact under if: always(), after the tests", () => {
    const list = steps(e2eJob());
    const upload = indexOfStep(list, /uses:\s*actions\/upload-artifact@/);
    expect(upload, "an actions/upload-artifact step").toBeGreaterThanOrEqual(0);
    const step = list[upload] as string;
    expect(step).toMatch(/^\s+if:\s*\$?\{?\{?\s*always\(\)\s*\}?\}?\s*$/m);
    expect(step).toMatch(/path:\s*apps\/web\/test-results\/?\s*$/m);
    const test_ = indexOfStep(list, /playwright test/);
    expect(test_).toBeGreaterThanOrEqual(0);
    expect(upload).toBeGreaterThan(test_);
  });

  test("T-F11-04: the existing ci job still runs build, typecheck, check:effect, lint and test, unchanged", () => {
    const ci = jobs().get("ci");
    expect(ci, "the ci job").toBeDefined();
    const job = ci as string;
    expect(job).toMatch(/name:\s*build, typecheck, lint, test\s*$/m);
    expect(job).toMatch(/timeout-minutes:\s*20\s*$/m);
    expect(job).toMatch(/image:\s*postgres:17-alpine/);
    expect(job).toMatch(/DATABASE_URL:\s*postgres:\/\/avel:avel@127\.0\.0\.1:5432\/avel/);
    const runs = steps(job).map((s) => /run:\s*(.+)$/m.exec(s)?.[1]?.trim());
    expect(runs.filter((r) => r !== undefined)).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm build",
      "pnpm typecheck",
      "pnpm --filter @avel/server run check:effect",
      "pnpm lint",
      "pnpm test",
    ]);
    expect(job).not.toMatch(/playwright/);
    // The new job sits beside it, not inside it.
    expect(jobs().size).toBeGreaterThanOrEqual(2);
  });
});

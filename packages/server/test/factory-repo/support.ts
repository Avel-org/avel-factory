/**
 * Harness for T-B15's acceptance tests. It names the seams the build must provide (listed in the
 * report for the lead to confirm before the lock):
 *
 *   src/platform/app.ts
 *     createApp({ ..., webhook?: { databaseUrl, secret, repo, appLogin } }). With `webhook`, the
 *     app serves POST /api/webhooks/github outside the contract, still with X-Request-Id and
 *     X-Contract-Version. `secret` is GITHUB_WEBHOOK_SECRET, `repo` is the factory repo's
 *     "owner/name", `appLogin` is the factory App's login (merged_by.login). The same `clock`
 *     option drives the rate limit (name "webhook", 60 a minute, keyed by the socket peer).
 *     A signed delivery that is handled, replayed or ignored is 2xx (the tests accept 200 to 299).
 *     A bad or missing X-Hub-Signature-256 is 401 UNAUTHORIZED as an ErrorBody, writing nothing.
 *     Payloads are GitHub's pull_request event: action "closed", pull_request.merged,
 *     merge_commit_sha, number, title, merged_at, merged_by.login, base.ref, and
 *     repository.full_name. approved_by is the one operator's users.id; summary is the PR title;
 *     merged_at is pull_request.merged_at.
 *     The alert is one `system.alert.raised` event whose payload has kind
 *     "unexpected_factory_merge" and the sha.
 *
 *   src/platform/factory-repo/index.ts
 *     makeFactoryRepo({ databaseUrl, mirrorPath, git?, fetchTimeoutMs? }) ->
 *       { readFactoryYaml(sha): Effect<string, FactoryRepoError>, close(): Promise<void> }
 *     `git` is the executable to run (default "git"); a child process, never a library. A refused
 *     SHA (no factory_versions row, or merged_by_app false) fails with _tag "FactoryShaRefused",
 *     a merged SHA without factory.yaml at the root with "FactoryYamlMissing", a fetch past
 *     fetchTimeoutMs (read from the Clock, so a TestClock moves it) with "FactoryFetchTimeout";
 *     each carries `sha`, and its message names the SHA. The mirror is fetched (`git fetch`, one
 *     run) only when it lacks the SHA.
 */
import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contract } from "@avel/contract";
import { implement } from "@orpc/server";
import { type Clock, Effect } from "effect";
import pg from "pg";
import { afterAll } from "vitest";
import { createApp } from "../../src/platform/app.ts";
import { effectHandler } from "../../src/platform/effect-handler.ts";
import { seedOperator } from "../../src/seed.ts";

export const ORIGIN = "http://avel.test";
export const REPO = "avel-test/factory";
export const APP_LOGIN = "avel-factory[bot]";
export const HUMAN_LOGIN = "someone-else";
/** A throwaway: made fresh on every run, never a value in the repo (E6). */
export const WEBHOOK_SECRET = `whsec-${randomBytes(24).toString("hex")}`;
export const FACTORY_YAML = "version: 1\nname: factory\n";

const MINUTE = 60_000;
/** On a whole minute, so the limiter's window and the test's minutes agree. */
export const T0 = Math.floor(Date.UTC(2026, 10, 19, 12, 0, 0) / MINUTE) * MINUTE;

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

export const tempDir = (label: string) => {
  const d = mkdtempSync(join(tmpdir(), `rigg-b15-${label}-`));
  dirs.push(d);
  return d;
};

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@avel.test",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@avel.test",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

export const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, env: GIT_ENV, encoding: "utf8" }).trim();

/** A local bare "origin" with a work clone; no network (Step 1 plan, risks). */
export function makeOrigin() {
  const root = tempDir("origin");
  const bare = join(root, "origin.git");
  const work = join(root, "work");
  execFileSync("git", ["init", "--bare", "-b", "main", bare], { env: GIT_ENV });
  execFileSync("git", ["clone", bare, work], { env: GIT_ENV, stdio: "ignore" });
  git(work, "checkout", "-b", "main");
  return {
    root,
    bare,
    /** Commits a file on the current branch of the work clone and pushes it; returns the SHA. */
    commit(file: string | null, content: string, branch = "main") {
      git(work, "checkout", "-B", branch);
      if (file !== null) {
        writeFileSync(join(work, file), content);
        git(work, "add", file);
      }
      git(work, "commit", "--allow-empty", "-m", `change ${randomBytes(3).toString("hex")}`);
      git(work, "push", "-f", "origin", branch);
      const sha = git(work, "rev-parse", "HEAD");
      git(work, "checkout", "main");
      return sha;
    },
  };
}

/** A mirror of the origin as it is now. */
export function makeMirror(origin: { bare: string; root: string }) {
  const path = join(tempDir("mirror"), "mirror.git");
  execFileSync("git", ["clone", "--mirror", origin.bare, path], { env: GIT_ENV, stdio: "ignore" });
  return path;
}

/**
 * A stand-in `git` that logs each call's arguments to `log`, then runs the real git, or, for a
 * `fetch` while `hangFile` exists, sleeps far past any timeout.
 */
export function gitWrapper(hang: boolean) {
  const dir = tempDir("gitbin");
  const log = join(dir, "calls.log");
  const script = join(dir, "git");
  writeFileSync(log, "");
  writeFileSync(
    script,
    `#!/bin/sh
echo "$*" >> "${log}"
${hang ? `for a in "$@"; do [ "$a" = fetch ] && exec sleep 600; done` : ""}
exec git "$@"
`,
  );
  chmodSync(script, 0o755);
  return {
    script,
    fetches: () =>
      readFileSync(log, "utf8")
        .split("\n")
        .filter((l) => l.split(" ").includes("fetch")).length,
  };
}

export const sign = (body: string, secret = WEBHOOK_SECRET) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

export interface MergeOptions {
  readonly sha: string;
  readonly by?: string;
  readonly number?: number;
  readonly merged?: boolean;
  readonly base?: string;
  readonly repo?: string;
  readonly title?: string;
}

/** A recorded-shape pull_request "closed" payload, as GitHub sends it. */
export function mergePayload(o: MergeOptions) {
  return {
    action: "closed",
    number: o.number ?? 7,
    pull_request: {
      number: o.number ?? 7,
      title: o.title ?? "Tighten the design system tokens",
      merged: o.merged ?? true,
      merged_at: o.merged === false ? null : "2026-11-19T11:30:00Z",
      merge_commit_sha: o.sha,
      merged_by: o.merged === false ? null : { login: o.by ?? APP_LOGIN, type: "Bot" },
      base: { ref: o.base ?? "main" },
      head: { ref: "factory/change" },
    },
    repository: { full_name: o.repo ?? REPO },
    sender: { login: o.by ?? APP_LOGIN },
  };
}

export const pushPayload = (sha: string, ref: string) => ({
  ref,
  after: sha,
  repository: { full_name: REPO },
});

let deliveryN = 0;
export const newDelivery = () => `delivery-${randomBytes(6).toString("hex")}-${deliveryN++}`;

export interface DeliveryOptions {
  readonly event?: string;
  readonly delivery?: string;
  readonly signature?: string | null;
  readonly secret?: string;
  readonly peer?: string;
}

export function deliver(
  app: { fetch(r: Request, peer?: { address: string }): Promise<Response> },
  payload: unknown,
  o: DeliveryOptions = {},
) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-github-event": o.event ?? "pull_request",
    "x-github-delivery": o.delivery ?? newDelivery(),
  };
  const signature = o.signature === undefined ? sign(body, o.secret) : o.signature;
  if (signature !== null) headers["x-hub-signature-256"] = signature;
  return app.fetch(
    new Request(`${ORIGIN}/api/webhooks/github`, { method: "POST", headers, body }),
    { address: o.peer ?? "192.0.2.10" },
  );
}

export function webhookApp(databaseUrl: string, clock?: Clock.Clock) {
  const os = implement(contract);
  const router = {
    health: { health: os.health.health.handler(effectHandler(() => Effect.succeed({}))) },
  };
  return createApp({
    router,
    ...(clock ? { clock } : {}),
    webhook: { databaseUrl, secret: WEBHOOK_SECRET, repo: REPO, appLogin: APP_LOGIN },
  } as Parameters<typeof createApp>[0]);
}

/** The loader, imported late so a missing module fails the test that needs it, not every file. */
export async function loadFactoryRepo() {
  const path = new URL("../../src/platform/factory-repo/index.ts", import.meta.url).href;
  return (await import(/* @vite-ignore */ path)) as {
    makeFactoryRepo: (o: {
      databaseUrl: string;
      mirrorPath: string;
      git?: string;
      fetchTimeoutMs?: number;
    }) => {
      readFactoryYaml: (
        sha: string,
      ) => Effect.Effect<string, { _tag: string; sha: string; message: string }>;
      close: () => Promise<void>;
    };
  };
}

export const operator = async (databaseUrl: string): Promise<string> => {
  await seedOperator({
    databaseUrl,
    email: "operator@avel.test",
    password: `pw-${randomBytes(12).toString("hex")}`,
  });
  const c = new pg.Client({ connectionString: databaseUrl });
  await c.connect();
  try {
    const r = await c.query<{ id: string }>("select id from users limit 1");
    return r.rows[0]?.id as string;
  } finally {
    await c.end();
  }
};

export async function rows<T extends pg.QueryResultRow>(databaseUrl: string, text: string) {
  const c = new pg.Client({ connectionString: databaseUrl });
  await c.connect();
  try {
    return (await c.query<T>(text)).rows;
  } finally {
    await c.end();
  }
}

export const versions = (url: string) =>
  rows<{
    sha: string;
    merged_by_app: boolean;
    approved_by: string;
    pr_number: number;
    summary: string;
    merged_at: Date;
  }>(url, "select * from factory_versions order by created_at");

export const alerts = (url: string) =>
  rows<{ seq: number; payload: Record<string, unknown> }>(
    url,
    "select seq, payload from events where kind = 'system.alert.raised' order by seq",
  );

export const deliveries = (url: string) =>
  rows<{ delivery_id: string }>(url, "select * from webhook_deliveries");

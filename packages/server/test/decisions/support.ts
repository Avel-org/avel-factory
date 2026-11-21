/**
 * Harness for T-B24's acceptance tests (routes 52, 53 and 104). It names the seams the build must
 * provide (listed in the report for the lead to confirm before the lock):
 *
 *   src/platform/router.ts            makeRouter({ databaseUrl }) also serves routes 52, 53 and 104
 *                                       (GET /api/pending-decisions, /api/proposals/{id}, /api/status),
 *                                       as it serves routes 8 to 11 for T-B14.
 *   src/factory/decisions/index.ts    countPendingDecisionsByMission: an Effect<ReadonlyMap<string, number>,
 *                                       never, Db>: mission id -> how many of route 52's rows carry that
 *                                       mission (a mission with none may be absent or 0). It reads only.
 *
 * What the tests assume about open items (CR-W2, DATABASE.md; the rows are inserted by SQL with
 * foreign keys off, so only the columns each rule reads are real):
 *   proposal                 proposals.state 'open' and expires_at in the future
 *   checkpoint               checkpoints.state 'draft'
 *   plan_finalize            plans.state 'draft'
 *   checkpoint_question      questions.answered_at null and after_question_id null
 *   pass_approval            a receipts row with verdict 'pass' and no pass_approvals row
 *   release                  a receipts row with verdict 'verified' on a mission in 'awaiting_release'
 *                              with no release_approvals row
 *   dispatch_package_commit  mission_docs.commit_state 'awaiting_confirmation' with gate1_passed_at set
 *   followup_send            followups.state 'drafted', kind 'followup'
 *   upkeep_offer             followups.state 'drafted', kind 'upkeep'
 * A returned item (CR-W15) is an open proposal that superseded another (proposals.superseded_by).
 * Time is the database's own now(): no test waits on a clock (F4).
 */
import { randomUUID } from "node:crypto";
import { ErrorBody, PendingDecisionDto, type ProposalOptions } from "@avel/contract";
import { Effect } from "effect";
import pg from "pg";
import { expect } from "vitest";
import { clientsApp, operatorCookie, send, sql } from "../clients/support.ts";
import { runDb } from "../db-service/support/db.ts";

export { clientsApp, operatorCookie, send, sql };
export type App = ReturnType<typeof clientsApp>;

export const UNKNOWN_PROPOSAL = "0193a000-0000-7000-8000-000000000b24";
export const uuid = () => randomUUID();
export const sha = () =>
  randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "").slice(0, 8);

export const OPTIONS = {
  choices: [
    {
      choice: "approve",
      label: "Approve",
      effect: "approve",
      consequence: "Work carries on",
      recommended: true,
    },
    { choice: "reject", label: "Reject", effect: "reject", consequence: "Work stops here" },
  ],
} satisfies ProposalOptions;

/** One statement on its own connection with foreign keys off (the seed is a fixture, not a flow). */
export async function q<T extends pg.QueryResultRow = pg.QueryResultRow>(
  url: string,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query("set session_replication_role = replica");
    return (await c.query<T>(text, values)).rows;
  } finally {
    await c.end();
  }
}

/** The mission's one live onboarding session (made on first use). */
export async function ensureSession(url: string, missionId: string): Promise<string> {
  const have = await q<{ id: string }>(
    url,
    "select id from onboarding_sessions where mission_id = $1",
    [missionId],
  );
  if (have[0]) return have[0].id;
  const id = uuid();
  await q(
    url,
    "insert into onboarding_sessions (id, mission_id, prompt_version) values ($1, $2, 'v1')",
    [id, missionId],
  );
  return id;
}

export interface Seed {
  readonly url: string;
  readonly clientId: string;
  readonly missionId: string;
}

/** A client and a mission (state given) to hang items on. */
export async function seedMission(
  url: string,
  options: { state?: string; name?: string } = {},
): Promise<Seed> {
  const clientId = uuid();
  const missionId = uuid();
  await q(url, "insert into clients (id, name, kind) values ($1, $2, 'client')", [
    clientId,
    `Client ${clientId.slice(0, 6)}`,
  ]);
  const state = options.state ?? "onboarding";
  const released = state === "awaiting_release";
  // Each state's CHECKs (missions_*_ck) need these columns; foreign keys are off, so the ids are free.
  await q(
    url,
    `insert into missions (id, name, client_id, kind, client_kind, state, budget_micros, onboarding_started_at, factory_commit,
       approved_at, plan_id, plan_state, package_key, package_version, price_micros, deadline_at, roster_version, kb_release,
       rules_version, rendered_at, branch_head)
     values ($1, $2, $3, 'client', 'client', $4, 15000000, now(), $5,
       $6, $7, $8, $9, $9, $10, $11, $12, $12, $12, $13, $14)`,
    [
      missionId,
      options.name ?? `Mission ${missionId.slice(0, 6)}`,
      clientId,
      state,
      sha(),
      released ? new Date().toISOString() : null,
      released ? uuid() : null,
      released ? "approved" : null,
      released ? "pkg" : null,
      released ? 1000000 : null,
      released ? new Date(Date.now() + 86400000).toISOString() : null,
      released ? "r1" : null,
      released ? new Date().toISOString() : null,
      released ? sha() : null,
    ],
  );
  return { url, clientId, missionId };
}

export interface ProposalSeed {
  state?: "open" | "resolved" | "expired" | "superseded";
  /** Days from now (database time) until it expires; negative = already past. */
  expiresInDays?: number;
  /** Days ago it was created. */
  createdDaysAgo?: number;
  reason?: string;
  options?: unknown;
  supersededBy?: string;
  kind?: string;
  subjectKey?: string;
  id?: string;
}

export async function seedProposal(s: Seed, p: ProposalSeed = {}): Promise<string> {
  const id = p.id ?? uuid();
  const state = p.state ?? "open";
  const resolved = state === "resolved" || state === "superseded" || state === "expired";
  await q(
    s.url,
    `insert into proposals (id, mission_id, kind, subject_key, reason, options, state, expires_at, created_at,
       choice, choice_reason, resolved_by, resolved_at, superseded_by)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, now() + ($8 || ' days')::interval, now() - ($9 || ' days')::interval,
       $10, $11, $12, $13, $14)`,
    [
      id,
      s.missionId,
      p.kind ?? "dependency",
      p.subjectKey ?? "payments-api",
      p.reason ?? "The build needs the payments-api package",
      JSON.stringify(p.options ?? OPTIONS),
      state,
      String(p.expiresInDays ?? 7),
      String(p.createdDaysAgo ?? 0),
      state === "resolved" || state === "superseded" ? "approve" : null,
      state === "resolved" || state === "superseded" ? "Fine" : null,
      state === "resolved" || state === "superseded" ? await operatorUserId(s.url) : null,
      state === "resolved" || state === "superseded" ? new Date().toISOString() : null,
      p.supersededBy ?? null,
    ],
  );
  void resolved;
  return id;
}

const operatorUserId = async (url: string) =>
  (await q<{ id: string }>(url, "select id from users limit 1"))[0]?.id ?? null;

/** Every kind the route serves, one open row each, on one mission. Returns the ids by kind. */
export async function seedOneOfEachOpen(s: Seed) {
  const url = s.url;
  const out: Record<string, string> = {};
  out.proposal = await seedProposal(s);

  const sessionId = await ensureSession(url, s.missionId);
  out.checkpoint = uuid();
  await q(
    url,
    "insert into checkpoints (id, mission_id, session_id, checkpoint, version, sections, state) values ($1, $2, $3, '0.1', 1, '{}'::jsonb, 'draft')",
    [out.checkpoint, s.missionId, sessionId],
  );

  out.plan_finalize = uuid();
  await q(
    url,
    `insert into plans (id, mission_id, version, source, session_id, package_key, package_version, roster_version, brief_snapshot, price_micros, state)
     values ($1, $2, 1, 'onboarding', $3, 'pkg', '1', 'r1', '{}'::jsonb, 1000000, 'draft')`,
    [out.plan_finalize, s.missionId, sessionId],
  );

  out.checkpoint_question = uuid();
  await q(
    url,
    `insert into questions (id, session_id, stage, text, blocking, subject_checkpoint, code, options)
     values ($1, $2, 'discovery', 'Who signs off the quote form?', true, '0.1', 'Q-0.1a', $3::jsonb)`,
    [
      out.checkpoint_question,
      sessionId,
      JSON.stringify([{ id: "a", label: "Javaris", consequence: "He approves" }]),
    ],
  );

  // A pass receipt with no pass approval, and a verified one on a mission awaiting release.
  out.pass_approval = await seedReceipt(s, "pass");
  const awaiting = await seedMission(url, { state: "awaiting_release" });
  out.release = await seedReceipt(awaiting, "verified");
  out.releaseMission = awaiting.missionId;

  out.dispatch_package_commit = uuid();
  const planId = uuid();
  await q(
    url,
    `insert into plans (id, mission_id, version, source, session_id, package_key, package_version, roster_version, brief_snapshot, price_micros, state, approved_at, approved_by)
     values ($1, $2, 2, 'onboarding', $3, 'pkg', '1', 'r1', '{}'::jsonb, 1000000, 'approved', now(), $4)`,
    [planId, s.missionId, sessionId, uuid()],
  );
  await q(
    url,
    `insert into mission_docs (id, mission_id, plan_id, dispatch_md, hash, gate1_passed_at, commit_state)
     values ($1, $2, $3, '# Dispatch', $4, now(), 'awaiting_confirmation')`,
    [out.dispatch_package_commit, s.missionId, planId, sha()],
  );

  out.followup_send = await seedFollowup(s, "followup");
  out.upkeep_offer = await seedFollowup(s, "upkeep");
  return out;
}

export async function seedReceipt(s: Seed, verdict: "pass" | "verified" | "fail"): Promise<string> {
  const id = uuid();
  await q(
    s.url,
    `insert into receipts (id, mission_id, gate_run_id, version, hash, verdict, commit_sha, factory_commit, body,
       human_minutes, ai_tokens, ai_cost_micros, signature_key, signature, verdict_caps)
     values ($1, $2, $3, 1, $4, $5, $6, $6, '{}'::jsonb, 0, 0, 0, 'k', 's', $7)`,
    [id, s.missionId, uuid(), sha(), verdict, sha(), verdict === "pass" ? ["tests skipped"] : []],
  );
  return id;
}

export async function seedFollowup(s: Seed, kind: "followup" | "upkeep"): Promise<string> {
  const id = uuid();
  await q(
    s.url,
    `insert into followups (id, client_id, mission_id, kind, draft, draft_hash, channel, state)
     values ($1, $2, $3, $4, 'Hi, a quick note on your project.', $5, 'copy', 'drafted')`,
    [id, s.clientId, s.missionId, kind, sha()],
  );
  return id;
}

export interface Page {
  items: unknown[];
  nextCursor: string | null;
}

export async function listDecisions(app: App, cookie: string, query = "") {
  const res = await send(app, "GET", `/api/pending-decisions${query}`, { cookie });
  expect(res.status).toBe(200);
  const body = (await res.json()) as Page;
  return {
    raw: body,
    items: body.items.map((i) => PendingDecisionDto.parse(i)),
    nextCursor: body.nextCursor,
  };
}

/** Every page, following the cursor with this limit. */
export async function listAll(app: App, cookie: string, limit: number, extra = "") {
  const seen: Array<ReturnType<typeof PendingDecisionDto.parse>> = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 100; guard++) {
    const q: string = `?limit=${limit}${extra}${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`;
    const page = await listDecisions(app, cookie, q);
    seen.push(...page.items);
    cursor = page.nextCursor;
    if (cursor === null) return seen;
  }
  throw new Error("route 52 never ended its pages");
}

export async function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status);
  const body = ErrorBody.parse(await res.json());
  expect(body.code).toBe(code);
  expect(body.requestId).toBe(res.headers.get("x-request-id"));
  expect(body.requestId.length).toBeGreaterThan(0);
  return body;
}

export { Effect, runDb };

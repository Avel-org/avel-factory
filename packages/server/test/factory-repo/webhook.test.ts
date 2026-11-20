/**
 * T-B15-01 to 06: the GitHub webhook and what it does with the loader (Step 1 item 1, test 12).
 * Payloads are recorded in GitHub's shape and signed here with a throwaway secret. No GitHub call.
 * Routes outside the contract have no rowVersion, so the E13 "stale rowVersion" four doesn't apply;
 * the other three are tests 01, 01/06 (error body with requestId) and 05 (replay).
 */
import { ErrorBody } from "@avel/contract";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { testClock } from "../auth/support.ts";
import { testDatabase } from "../db/support/database.ts";
import {
  alerts,
  deliver,
  deliveries,
  FACTORY_YAML,
  HUMAN_LOGIN,
  loadFactoryRepo,
  makeMirror,
  makeOrigin,
  mergePayload,
  newDelivery,
  operator,
  pushPayload,
  sign,
  versions,
  webhookApp,
} from "./support.ts";

const database = testDatabase("b15hook");
const ok = (res: Response) => res.status >= 200 && res.status < 300;

async function setup() {
  const d = await database();
  const userId = await operator(d.url);
  const clock = await testClock();
  const app = webhookApp(d.url, clock.clock);
  return { d, userId, app, clock };
}

const clean = async (url: string) => {
  const c = await (await database()).client();
  await c.query("delete from factory_versions; delete from webhook_deliveries; delete from events");
  void url;
};

describe("T-B15-01 · signature", () => {
  it("a bad or missing X-Hub-Signature-256 is 401 with an ErrorBody and requestId, and writes nothing", async () => {
    const { d, app } = await setup();
    await clean(d.url);
    const origin = makeOrigin();
    const sha = origin.commit("factory.yaml", FACTORY_YAML);
    const payload = mergePayload({ sha });

    const cases = [
      { name: "missing", signature: null },
      { name: "wrong secret", secret: "not-the-secret" },
      { name: "no prefix", signature: sign(JSON.stringify(payload)).slice("sha256=".length) },
      { name: "garbage", signature: "sha256=zz" },
    ];
    for (const c of cases) {
      const res = await deliver(app, payload, { ...c, delivery: newDelivery() });
      expect(res.status, c.name).toBe(401);
      const body = ErrorBody.parse(await res.json());
      expect(body.code).toBe("UNAUTHORIZED");
      expect(body.requestId).toBe(res.headers.get("x-request-id"));
      expect(res.headers.get("x-contract-version")).toBeTruthy();
    }
    // Signed over a different body than the one sent.
    const tampered = await deliver(app, payload, { signature: sign(JSON.stringify({ x: 1 })) });
    expect(tampered.status).toBe(401);

    expect(await versions(d.url)).toEqual([]);
    expect(await alerts(d.url)).toEqual([]);
    expect(await deliveries(d.url)).toEqual([]);
  });
});

describe("T-B15-02 · merge by the App", () => {
  it("adds one factory_versions row with merged_by_app true, and the loader reads factory.yaml at that SHA", async () => {
    const { d, app, userId } = await setup();
    await clean(d.url);
    const origin = makeOrigin();
    const sha = origin.commit("factory.yaml", FACTORY_YAML);
    const mirror = makeMirror(origin);

    const res = await deliver(app, mergePayload({ sha, number: 12, title: "Add the kb layer" }));
    expect(ok(res)).toBe(true);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(res.headers.get("x-contract-version")).toBeTruthy();

    const found = await versions(d.url);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      sha,
      merged_by_app: true,
      approved_by: userId,
      pr_number: 12,
      summary: "Add the kb layer",
    });
    expect(found[0]?.merged_at.toISOString()).toBe("2026-11-19T11:30:00.000Z");
    expect(await alerts(d.url)).toEqual([]);
    expect(await deliveries(d.url)).toHaveLength(1);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      expect(await Effect.runPromise(repo.readFactoryYaml(sha))).toBe(FACTORY_YAML);
    } finally {
      await repo.close();
    }
  });
});

describe("T-B15-03 · merge by anyone else", () => {
  it("adds a row with merged_by_app false and one system.alert.raised, and the loader refuses that SHA", async () => {
    const { d, app } = await setup();
    await clean(d.url);
    const origin = makeOrigin();
    const sha = origin.commit("factory.yaml", FACTORY_YAML);
    const mirror = makeMirror(origin);

    const res = await deliver(app, mergePayload({ sha, by: HUMAN_LOGIN }));
    expect(ok(res)).toBe(true);

    const found = await versions(d.url);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ sha, merged_by_app: false });
    const raised = await alerts(d.url);
    expect(raised).toHaveLength(1);
    expect(raised[0]?.payload).toMatchObject({ kind: "unexpected_factory_merge", sha });

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      const err = await Effect.runPromise(Effect.flip(repo.readFactoryYaml(sha)));
      expect(err._tag).toBe("FactoryShaRefused");
      expect(err.sha).toBe(sha);
    } finally {
      await repo.close();
    }
  });

  it("a merge on another repo, or on another branch of this one, is acknowledged and ignored", async () => {
    const { d, app } = await setup();
    await clean(d.url);
    const sha = makeOrigin().commit("factory.yaml", FACTORY_YAML);
    for (const p of [
      mergePayload({ sha, by: HUMAN_LOGIN, repo: "someone/else" }),
      mergePayload({ sha, by: HUMAN_LOGIN, base: "release" }),
    ]) {
      expect(ok(await deliver(app, p))).toBe(true);
    }
    expect(await versions(d.url)).toEqual([]);
    expect(await alerts(d.url)).toEqual([]);
  });
});

describe("T-B15-04 · unmerged branch", () => {
  it("a commit on an unmerged branch has no effect, and the loader refuses its SHA", async () => {
    const { d, app } = await setup();
    await clean(d.url);
    const origin = makeOrigin();
    origin.commit("factory.yaml", FACTORY_YAML);
    const sha = origin.commit("factory.yaml", "version: 2\n", "feature/x");
    const mirror = makeMirror(origin);

    const closedUnmerged = await deliver(app, mergePayload({ sha, merged: false }));
    const pushed = await deliver(app, pushPayload(sha, "refs/heads/feature/x"), { event: "push" });
    const pinged = await deliver(app, { zen: "hi" }, { event: "ping" });
    for (const res of [closedUnmerged, pushed, pinged]) expect(ok(res)).toBe(true);

    expect(await versions(d.url)).toEqual([]);
    expect(await alerts(d.url)).toEqual([]);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      const err = await Effect.runPromise(Effect.flip(repo.readFactoryYaml(sha)));
      expect(err._tag).toBe("FactoryShaRefused");
    } finally {
      await repo.close();
    }
  });
});

describe("T-B15-05 · replay", () => {
  it("a replayed X-GitHub-Delivery is acknowledged and ignored: no second row, no second event", async () => {
    const { d, app } = await setup();
    await clean(d.url);
    const sha = makeOrigin().commit("factory.yaml", FACTORY_YAML);
    const delivery = newDelivery();
    const payload = mergePayload({ sha, by: HUMAN_LOGIN });

    const first = await deliver(app, payload, { delivery });
    const second = await deliver(app, payload, { delivery });
    expect(ok(first)).toBe(true);
    expect(ok(second)).toBe(true);
    expect(second.headers.get("x-request-id")).toBeTruthy();

    expect(await versions(d.url)).toHaveLength(1);
    expect(await alerts(d.url)).toHaveLength(1);
    expect((await deliveries(d.url)).map((r) => r.delivery_id)).toEqual([delivery]);
  });
});

describe("T-B15-06 · rate limit", () => {
  it("the 61st delivery in a minute is 429 with the contract's body and a requestId; the next minute is open", async () => {
    const { d, app, clock } = await setup();
    await clean(d.url);
    for (let i = 1; i <= 60; i++) {
      const res = await deliver(app, { zen: `n${i}` }, { event: "ping" });
      expect(ok(res), `delivery ${i}`).toBe(true);
    }
    const res = await deliver(app, { zen: "61" }, { event: "ping" });
    expect(res.status).toBe(429);
    const body = ErrorBody.parse(await res.json());
    expect(body.code).toBe("TOO_MANY_REQUESTS");
    expect(body.requestId).toBe(res.headers.get("x-request-id"));
    expect(body.details).toEqual({ retryAfterMs: 60_000 });
    expect(res.headers.get("x-contract-version")).toBeTruthy();

    await clock.advance(60_000);
    expect(ok(await deliver(app, { zen: "again" }, { event: "ping" }))).toBe(true);
  });
});

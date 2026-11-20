/**
 * T-B19-03 (t-b15-rigg-02): a signed push to the factory repo's main that isn't the App's merge
 * raises exactly one system.alert.raised, in the same transaction as its delivery row, and its SHA
 * stays unselectable; a merged pull_request payload that doesn't parse raises an alert. Other
 * events, repos and branches stay acknowledged and ignored.
 */
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
  REPO,
  versions,
  webhookApp,
} from "../factory-repo/support.ts";
import { APP_LOGIN } from "./support.ts";

const database = testDatabase("b19alerts");
const ok = (res: Response) => res.status >= 200 && res.status < 300;

const push = (sha: string, o: { ref?: string; by?: string; repo?: string } = {}) => ({
  ref: o.ref ?? "refs/heads/main",
  before: "0".repeat(40),
  after: sha,
  repository: { full_name: o.repo ?? REPO },
  pusher: { name: o.by ?? HUMAN_LOGIN },
  sender: { login: o.by ?? HUMAN_LOGIN },
  head_commit: { id: sha },
});

async function setup() {
  const d = await database();
  await operator(d.url);
  const c = await d.client();
  await c.query("delete from factory_versions; delete from webhook_deliveries; delete from events");
  const clock = await testClock();
  return { d, app: webhookApp(d.url, clock.clock) };
}

describe("T-B19-03 · an admin bypass, and a payload that doesn't parse", () => {
  it("a signed push to main by anyone but the App raises one alert with its delivery row, and its SHA is refused", async () => {
    const { d, app } = await setup();
    const origin = makeOrigin();
    const sha = origin.commit("factory.yaml", FACTORY_YAML);
    const mirror = makeMirror(origin);
    const delivery = newDelivery();

    const res = await deliver(app, push(sha), { event: "push", delivery });
    expect(ok(res)).toBe(true);

    const raised = await alerts(d.url);
    expect(raised, "a direct push to main raised no alert").toHaveLength(1);
    expect(JSON.stringify(raised[0]?.payload)).toContain(sha);
    expect(raised[0]?.payload).toHaveProperty("alert");
    expect((await deliveries(d.url)).map((r) => r.delivery_id)).toEqual([delivery]);

    // The same delivery again changes nothing.
    expect(ok(await deliver(app, push(sha), { event: "push", delivery }))).toBe(true);
    expect(await alerts(d.url)).toHaveLength(1);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      const err = await Effect.runPromise(Effect.flip(repo.readFactoryYaml(sha)));
      expect(err._tag).toBe("FactoryShaRefused");
      expect(err.sha).toBe(sha);
    } finally {
      await repo.close();
    }
    // Whatever row it left, none is the App's.
    expect((await versions(d.url)).filter((v) => v.merged_by_app)).toEqual([]);
  });

  it("a push by the App after its own merge raises no alert, and the merged SHA stays selectable", async () => {
    const { d, app } = await setup();
    const origin = makeOrigin();
    const sha = origin.commit("factory.yaml", FACTORY_YAML);
    const mirror = makeMirror(origin);

    expect(ok(await deliver(app, mergePayload({ sha })))).toBe(true);
    expect(ok(await deliver(app, push(sha, { by: APP_LOGIN }), { event: "push" }))).toBe(true);
    expect(await alerts(d.url)).toEqual([]);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      expect(await Effect.runPromise(repo.readFactoryYaml(sha))).toBe(FACTORY_YAML);
    } finally {
      await repo.close();
    }
  });

  it("a push to another branch, or another repo's main, is acknowledged and ignored", async () => {
    const { d, app } = await setup();
    const sha = "b".repeat(40);
    for (const p of [
      push(sha, { ref: "refs/heads/feature/x" }),
      push(sha, { repo: "someone/else" }),
    ]) {
      expect(ok(await deliver(app, p, { event: "push" }))).toBe(true);
    }
    expect(await alerts(d.url)).toEqual([]);
    expect(await versions(d.url)).toEqual([]);
  });

  it("a merged pull_request payload that doesn't parse raises one alert instead of being dropped", async () => {
    const { d, app } = await setup();
    const broken = mergePayload({ sha: "c".repeat(40) });
    // merged and closed, but its merge commit is not a SHA
    (broken.pull_request as { merge_commit_sha: unknown }).merge_commit_sha = "not-a-sha";
    const delivery = newDelivery();

    expect(ok(await deliver(app, broken, { delivery }))).toBe(true);
    const raised = await alerts(d.url);
    expect(raised, "an unparseable merge raised no alert").toHaveLength(1);
    expect(raised[0]?.payload).toHaveProperty("alert");
    expect((await deliveries(d.url)).map((r) => r.delivery_id)).toEqual([delivery]);
    expect(await versions(d.url)).toEqual([]);

    expect(ok(await deliver(app, broken, { delivery }))).toBe(true);
    expect(await alerts(d.url)).toHaveLength(1);
  });

  it("a closed pull_request that wasn't merged, even malformed, raises nothing", async () => {
    const { d, app } = await setup();
    const unmerged = {
      action: "closed",
      pull_request: { merged: false, number: "x" },
      repository: { full_name: REPO },
    };
    expect(ok(await deliver(app, unmerged))).toBe(true);
    expect(await alerts(d.url)).toEqual([]);
  });
});

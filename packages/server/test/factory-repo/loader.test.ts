/**
 * T-B15-07 and 08: the factory repo loader. A merged SHA is the only thing it answers for; its git
 * is a child process against a local mirror, with a timeout on the fetch (Writing Effect rule 5).
 */
import { it } from "@effect/vitest";
import { Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";
import pg from "pg";
import { describe, expect } from "vitest";
import { testDatabase } from "../db/support/database.ts";
import {
  FACTORY_YAML,
  gitWrapper,
  loadFactoryRepo,
  makeMirror,
  makeOrigin,
  operator,
} from "./support.ts";

const database = testDatabase("b15load");

/** A factory_versions row, as the webhook would have written it. */
async function merged(url: string, userId: string, sha: string, byApp = true) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(
      `insert into factory_versions (sha, merged_at, approved_by, merged_by_app, summary, pr_number)
       values ($1, now(), $2, $3, 'test', 1)`,
      [sha, userId, byApp],
    );
  } finally {
    await c.end();
  }
}

describe("T-B15-07 · no factory.yaml", () => {
  it("a merged SHA with no factory.yaml at the repo root is a typed error naming the SHA", async () => {
    const d = await database();
    const userId = await operator(d.url);
    const origin = makeOrigin();
    origin.commit("factory.yml", FACTORY_YAML); // not the name, and a nested one would not count either
    const sha = origin.commit("README.md", "hello");
    const mirror = makeMirror(origin);
    await merged(d.url, userId, sha);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror });
    try {
      const err = await Effect.runPromise(Effect.flip(repo.readFactoryYaml(sha)));
      expect(err._tag).toBe("FactoryYamlMissing");
      expect(err.sha).toBe(sha);
      expect(err.message).toContain(sha);
    } finally {
      await repo.close();
    }
  });
});

describe("T-B15-08 · the mirror fetch", () => {
  it("a mirror missing the SHA is fetched once; a mirror with it is not fetched", async () => {
    const d = await database();
    const userId = await operator(d.url);
    const origin = makeOrigin();
    const old = origin.commit("factory.yaml", FACTORY_YAML);
    const mirror = makeMirror(origin);
    const newer = origin.commit("factory.yaml", "version: 2\n"); // the mirror hasn't seen it
    await merged(d.url, userId, old);
    await merged(d.url, userId, newer);
    const wrapper = gitWrapper(false);

    const { makeFactoryRepo } = await loadFactoryRepo();
    const repo = makeFactoryRepo({ databaseUrl: d.url, mirrorPath: mirror, git: wrapper.script });
    try {
      expect(await Effect.runPromise(repo.readFactoryYaml(old))).toBe(FACTORY_YAML);
      expect(wrapper.fetches()).toBe(0);
      expect(await Effect.runPromise(repo.readFactoryYaml(newer))).toBe("version: 2\n");
      expect(wrapper.fetches()).toBe(1);
      // Now it has it: no second fetch.
      expect(await Effect.runPromise(repo.readFactoryYaml(newer))).toBe("version: 2\n");
      expect(wrapper.fetches()).toBe(1);
    } finally {
      await repo.close();
    }
  });

  it.effect("a fetch that hangs ends within its timeout (TestClock) as a typed error", () =>
    Effect.gen(function* () {
      const timeoutMs = 5_000;
      const d = yield* Effect.promise(() => database());
      const userId = yield* Effect.promise(() => operator(d.url));
      const origin = makeOrigin();
      origin.commit("factory.yaml", FACTORY_YAML);
      const mirror = makeMirror(origin);
      const newer = origin.commit("factory.yaml", "version: 2\n");
      yield* Effect.promise(() => merged(d.url, userId, newer));
      const wrapper = gitWrapper(true);

      const { makeFactoryRepo } = yield* Effect.promise(() => loadFactoryRepo());
      const repo = makeFactoryRepo({
        databaseUrl: d.url,
        mirrorPath: mirror,
        git: wrapper.script,
        fetchTimeoutMs: timeoutMs,
      });
      try {
        const fiber = yield* Effect.forkChild(Effect.flip(repo.readFactoryYaml(newer)));
        // Wait until the loader's git fetch has started (the wrapper logs it), so the clock moves
        // past the timeout only while the fetch hangs. Under load, starting git can outlast many
        // event-loop turns, and moving the clock first timed out before any fetch (main, Nov 20).
        for (
          let i = 0;
          i < 1_000 && wrapper.fetches() === 0 && fiber.pollUnsafe() === undefined;
          i++
        ) {
          yield* Effect.promise(() => new Promise((r) => setTimeout(r, 10)));
        }
        // Then move the clock past the timeout. Nothing else waits on the wall clock.
        let exit = fiber.pollUnsafe();
        for (let i = 0; i < 200 && exit === undefined; i++) {
          yield* Effect.promise(() => new Promise((r) => setTimeout(r, 0)));
          yield* TestClock.adjust(timeoutMs);
          exit = fiber.pollUnsafe();
        }
        const err = yield* Fiber.join(fiber);
        expect(err._tag).toBe("FactoryFetchTimeout");
        expect(err.sha).toBe(newer);
        expect(wrapper.fetches()).toBe(1);
      } finally {
        yield* Effect.promise(() => repo.close());
      }
    }),
  );
});

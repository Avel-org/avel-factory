/**
 * T-B3's acceptance tests. The seams the build must provide (listed in the report for the lead
 * to confirm before the lock):
 *
 *   src/platform/errors.ts     AlreadyExists, ConstraintViolation, DeleteRefused, StaleVersion:
 *                              tagged errors ({ message, details }) with rows in errorTable
 *   src/platform/db/errors.ts  mapDbError(error: unknown):
 *                                AlreadyExists | ConstraintViolation | DeleteRefused | undefined
 *                                (undefined: not one of ours, so the caller keeps it a defect)
 *                              requireUpdated(rows: readonly A[], currentVersion: number):
 *                                Effect<A, StaleVersion>   (no row updated -> StaleVersion)
 */
import { ErrorBody, REQUEST_ID_HEADER } from "@avel/contract";
import { Effect } from "effect";
import type pg from "pg";
import { describe, expect, it } from "vitest";
import { appRunning, fixedIds, get } from "../support/harness.ts";
import { testDatabase } from "./support/database.ts";

const ID = "0193a000-0000-7000-8000-0000000000dd";
const db = testDatabase("b3");

const loadErrors = () => import("../../src/platform/db/errors.ts");
const loadTags = () => import("../../src/platform/errors.ts");

/** The raw failure of a statement on the real database, as node-postgres throws it. */
async function failure(client: pg.Client, sql: string, params: unknown[] = []): Promise<unknown> {
  try {
    await client.query(sql, params);
  } catch (e) {
    return e;
  }
  throw new Error(`expected the statement to fail: ${sql}`);
}

const addUser = (client: pg.Client, email: string) =>
  client.query("insert into users (name, email) values ('Op', $1) returning id", [email]);

/**
 * Runs the statement on the real database inside a route's program, mapping its failure the way
 * T-B4's Db service will: a mapped error is a tagged failure, anything else a defect.
 */
function route(client: pg.Client, sql: string, params: unknown[] = []) {
  return async () => {
    const { mapDbError } = await loadErrors();
    const program = () =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          client.query(sql, params).then(
            () => ({ failed: false as const }),
            (error: unknown) => ({ failed: true as const, error }),
          ),
        );
        if (!result.failed) return {};
        const mapped = mapDbError(result.error);
        if (mapped) return yield* Effect.fail(mapped);
        return yield* Effect.die(result.error);
      });
    return appRunning(program, { layer: fixedIds(ID) });
  };
}

async function expectBody(res: Response, status: number, code: string, details: unknown) {
  expect(res.status).toBe(status);
  const body = ErrorBody.parse(await res.json());
  expect(body.code).toBe(code);
  expect(body.details).toEqual(details);
  expect(body.requestId).toBe(ID);
  expect(res.headers.get(REQUEST_ID_HEADER)).toBe(ID);
}

describe("T-B3-01 · harness: each test file gets its own migrated database", () => {
  it("makes a migrated database that is its own, and a real violation carries the fields the mapper reads", async () => {
    const mine = await db();
    const other = await testDatabase("b3other")();
    expect(mine.name).not.toBe(other.name);

    const client = await mine.client();
    const current = await client.query("select current_database() as name");
    expect(current.rows[0].name).toBe(mine.name);
    const tables = await client.query(
      "select count(*)::int as n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind = 'r'",
    );
    expect(tables.rows[0].n).toBeGreaterThan(80);

    // Data written here is invisible in the other file's database.
    await addUser(client, "own@avel.test");
    const elsewhere = await (await other.client()).query("select count(*)::int as n from users");
    expect(elsewhere.rows[0].n).toBe(0);

    // The mapper's input is a node-postgres error with `code` and `constraint`...
    const raw = (await failure(
      client,
      "insert into users (name, email) values ('Op', 'own@avel.test')",
    )) as {
      code?: string;
      constraint?: string;
    };
    expect(raw.code).toBe("23505");
    expect(raw.constraint).toBe("users_email_uq");
    // ...and the build provides the function that reads it.
    expect(typeof (await loadErrors()).mapDbError).toBe("function");
  });
});

describe("T-B3-02 · a unique violation", () => {
  it("becomes AlreadyExists naming users_email_uq", async () => {
    const client = await (await db()).client();
    await addUser(client, "dup@avel.test");
    const raw = await failure(
      client,
      "insert into users (name, email) values ('Two', 'dup@avel.test')",
    );

    const { mapDbError } = await loadErrors();
    const { AlreadyExists } = await loadTags();
    const mapped = mapDbError(raw);
    expect(mapped).toBeInstanceOf(AlreadyExists);
    expect(mapped?._tag).toBe("AlreadyExists");
    expect(mapped?.details).toEqual({ constraint: "users_email_uq" });
  });

  it("is a 409 ALREADY_EXISTS through effectHandler, with the constraint and the requestId", async () => {
    const client = await (await db()).client();
    await addUser(client, "dup2@avel.test");
    const app = await route(
      client,
      "insert into users (name, email) values ('Two', 'dup2@avel.test')",
    )();
    await expectBody(await get(app, "/api/health"), 409, "ALREADY_EXISTS", {
      constraint: "users_email_uq",
    });
  });
});

describe("T-B3-03 · a CHECK violation", () => {
  const bad = "insert into jobs (kind, key, state) values ('k', 'check-1', 'not-a-state')";

  it("becomes ConstraintViolation naming the CHECK", async () => {
    const client = await (await db()).client();
    const raw = await failure(client, bad);

    const { mapDbError } = await loadErrors();
    const { ConstraintViolation } = await loadTags();
    const mapped = mapDbError(raw);
    expect(mapped).toBeInstanceOf(ConstraintViolation);
    expect(mapped?.details).toEqual({ constraint: "jobs_state_ck" });
  });

  it("is a 422 CONSTRAINT_VIOLATION through effectHandler, with the requestId", async () => {
    const client = await (await db()).client();
    const app = await route(client, bad)();
    await expectBody(await get(app, "/api/health"), 422, "CONSTRAINT_VIOLATION", {
      constraint: "jobs_state_ck",
    });
  });
});

describe("T-B3-04 · a foreign key", () => {
  const missingParent =
    "insert into cli_sessions (user_id, token_sha256, label, expires_at) values ($1, 'sha-missing', 'cli', now())";
  const NO_USER = "0193a000-0000-7000-8000-00000000ffff";

  async function userWithSession(client: pg.Client, email: string, sha: string) {
    const user = await addUser(client, email);
    const id = user.rows[0].id as string;
    await client.query(
      "insert into cli_sessions (user_id, token_sha256, label, expires_at) values ($1, $2, 'cli', now())",
      [id, sha],
    );
    return id;
  }

  it("a refused delete becomes DeleteRefused, a 409 DELETE_REFUSED", async () => {
    const client = await (await db()).client();
    const id = await userWithSession(client, "fk1@avel.test", "sha-del-1");
    const raw = await failure(client, "delete from users where id = $1", [id]);

    const { mapDbError } = await loadErrors();
    const { DeleteRefused } = await loadTags();
    const mapped = mapDbError(raw);
    expect(mapped).toBeInstanceOf(DeleteRefused);
    expect(mapped?.details).toEqual({ constraint: "cli_sessions_user_id_users_id_fk" });

    const id2 = await userWithSession(client, "fk2@avel.test", "sha-del-2");
    const app = await route(client, "delete from users where id = $1", [id2])();
    await expectBody(await get(app, "/api/health"), 409, "DELETE_REFUSED", {
      constraint: "cli_sessions_user_id_users_id_fk",
    });
  });

  it("a missing parent on insert becomes ConstraintViolation, a 422 CONSTRAINT_VIOLATION", async () => {
    const client = await (await db()).client();
    const raw = await failure(client, missingParent, [NO_USER]);

    const { mapDbError } = await loadErrors();
    const { ConstraintViolation } = await loadTags();
    const mapped = mapDbError(raw);
    expect(mapped).toBeInstanceOf(ConstraintViolation);
    expect(mapped?.details).toEqual({ constraint: "cli_sessions_user_id_users_id_fk" });

    const app = await route(client, missingParent, [NO_USER])();
    await expectBody(await get(app, "/api/health"), 422, "CONSTRAINT_VIOLATION", {
      constraint: "cli_sessions_user_id_users_id_fk",
    });
  });
});

describe("T-B3-05 · a versioned update that matches no row", () => {
  async function staleUpdate(client: pg.Client) {
    await client.query(
      "insert into jobs (kind, key) values ('k', 'stale-1') on conflict do nothing",
    );
    await client.query("update jobs set row_version = 3 where key = 'stale-1'");
    const result = await client.query(
      "update jobs set last_error = 'x', row_version = row_version + 1 where key = 'stale-1' and row_version = 2 returning id",
    );
    return result.rows as { id: string }[];
  }

  it("becomes StaleVersion with field rowVersion and the current version", async () => {
    const client = await (await db()).client();
    const rows = await staleUpdate(client);
    expect(rows).toHaveLength(0);

    const { requireUpdated } = await loadErrors();
    const { StaleVersion } = await loadTags();
    const failed = await Effect.runPromise(Effect.flip(requireUpdated(rows, 3)));
    expect(failed).toBeInstanceOf(StaleVersion);
    expect(failed._tag).toBe("StaleVersion");
    expect(failed.details).toEqual({ field: "rowVersion", currentVersion: 3 });

    // The control: an update that did match a row passes through.
    const matched = await client.query(
      "update jobs set row_version = row_version + 1 where key = 'stale-1' and row_version = 3 returning id",
    );
    const ok = await Effect.runPromise(requireUpdated(matched.rows, 4));
    expect(ok).toEqual(matched.rows[0]);
  });

  it("is a 409 STALE_VERSION through effectHandler, with the requestId", async () => {
    const { requireUpdated } = await loadErrors();
    const app = appRunning(() => requireUpdated([], 7), { layer: fixedIds(ID) });
    await expectBody(await get(app, "/api/health"), 409, "STALE_VERSION", {
      field: "rowVersion",
      currentVersion: 7,
    });
  });
});

describe("T-B3-06 · any other database error", () => {
  const syntax = "selec nothing from nowhere";

  it("is not mapped: mapDbError leaves it for a defect", async () => {
    const client = await (await db()).client();
    const raw = await failure(client, syntax);
    expect((raw as { code?: string }).code).toBe("42601");

    const { mapDbError } = await loadErrors();
    expect(mapDbError(raw)).toBeUndefined();
    expect(mapDbError(new Error("not a database error"))).toBeUndefined();
    expect(mapDbError(undefined)).toBeUndefined();
  });

  it("is a 500 through effectHandler that never shows the database's message, and is logged with the requestId", async () => {
    const client = await (await db()).client();
    const lines: string[] = [];
    const { mapDbError } = await loadErrors();
    const app = appRunning(
      () =>
        Effect.gen(function* () {
          const err = yield* Effect.promise(() => failure(client, syntax));
          const mapped = mapDbError(err);
          if (mapped) return yield* Effect.fail(mapped);
          return yield* Effect.die(err);
        }),
      { layer: fixedIds(ID), logLine: (l) => lines.push(l) },
    );
    const res = await get(app, "/api/health");
    const text = await res.text();

    expect(res.status).toBe(500);
    const body = ErrorBody.parse(JSON.parse(text));
    expect(body.requestId).toBe(ID);
    expect(text).not.toContain("syntax");
    expect(text).not.toContain("selec");
    const logged = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    const mine = logged.filter((l) => JSON.stringify(l).includes("syntax error"));
    expect(mine.length).toBeGreaterThanOrEqual(1);
    for (const line of mine) expect(line.requestId).toBe(ID);
  });
});

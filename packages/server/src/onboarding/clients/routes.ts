import {
  type ClientIdInput,
  type CreateClientInput,
  contract,
  errorMap,
  type ListClientsInput,
  type UpdateClientInput,
  Uuid,
} from "@avel/contract";
import { clients } from "@avel/db";
import { implement } from "@orpc/server";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { Clock, type Context, Effect } from "effect";
import { recordActivity } from "../../audit/activity.ts";
import { Db, Tx } from "../../platform/db/db.ts";
import { requireUpdated } from "../../platform/db/errors.ts";
import { BadRequest, NotFound, Unprocessable } from "../../platform/errors.ts";
import type { Idempotency } from "../../platform/idempotency.ts";
import { Ids } from "../../platform/ids.ts";
import { toClientDto } from "./dto.ts";
import { idempotentWrite } from "./idempotent.ts";
import { operatorHandler } from "./operator.ts";

const os = implement(contract);

/** Route 8's page size when the query has no `limit`, as contract-mock serves. */
const DEFAULT_LIMIT = 50;

const notFound = () => new NotFound({ message: errorMap.NOT_FOUND.message });

const target = (id: string) => `clients/${id}`;

/** A `jsonb` value as SQL, so a JSON `null` is stored as one, never as SQL NULL. */
const jsonb = (value: unknown) => sql`${JSON.stringify(value)}::jsonb`;

/** Route 8: oldest first by id (a UUIDv7); the cursor is the last id of the page before. */
const list = (input: ListClientsInput) =>
  Effect.gen(function* () {
    if (input.cursor !== undefined && !Uuid.safeParse(input.cursor).success) {
      return yield* new BadRequest({ message: errorMap.BAD_REQUEST.message });
    }
    const limit = input.limit ?? DEFAULT_LIMIT;
    const db = yield* Db;
    const rows = yield* db.withTransaction(
      Effect.gen(function* () {
        const tx = yield* Tx;
        return yield* Effect.promise(() =>
          tx
            .select()
            .from(clients)
            .where(
              and(
                // The internal client (CR-13) only with ?kind=internal (CR-W22).
                eq(clients.kind, input.kind ?? "client"),
                input.status === undefined ? undefined : eq(clients.status, input.status),
                input.cursor === undefined ? undefined : gt(clients.id, input.cursor),
              ),
            )
            .orderBy(asc(clients.id))
            .limit(limit + 1),
        );
      }),
    );
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items: items.map(toClientDto),
      nextCursor: rows.length > limit && last !== undefined ? last.id : null,
    };
  });

/**
 * Route 9. The internal client is the seed's alone (CR-13), so a create of kind internal is
 * refused here (422), whether or not the seed has run; `clients_one_internal_uq` still guards
 * the table.
 */
const create = (input: CreateClientInput, userId: string) =>
  Effect.gen(function* () {
    if (input.kind === "internal") {
      return yield* new Unprocessable({ message: "Only the seed makes the internal client" });
    }
    const db = yield* Db;
    const ids = yield* Ids;
    const id = yield* ids.uuidv7;
    return yield* db.withTransaction(
      Effect.gen(function* () {
        const tx = yield* Tx;
        const [row] = yield* Effect.promise(() =>
          tx
            .insert(clients)
            .values({
              id,
              name: input.name,
              kind: input.kind,
              ...(input.contacts === undefined ? {} : { contacts: jsonb(input.contacts) }),
            })
            .returning(),
        );
        if (row === undefined) return yield* Effect.die(new Error("the insert returned no row"));
        yield* recordActivity({ userId, action: "clients.create", target: target(id) });
        return toClientDto(row);
      }),
    );
  });

/** Route 10. */
const get = (input: ClientIdInput) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const [row] = yield* db.withTransaction(
      Effect.gen(function* () {
        const tx = yield* Tx;
        return yield* Effect.promise(() =>
          tx.select().from(clients).where(eq(clients.id, input.clientId)),
        );
      }),
    );
    if (row === undefined) return yield* notFound();
    return toClientDto(row);
  });

/**
 * Route 11: an update at the version the client was read at. An unknown client is 404; one
 * whose version moved on is 409 `STALE_VERSION` with the current version. The row is locked
 * first, so that version is the one the update saw. The touch trigger moves `row_version` and
 * `updated_at`; `archived_at` follows `status`.
 */
const update = (input: UpdateClientInput, userId: string) =>
  Effect.gen(function* () {
    const db = yield* Db;
    const now = new Date(yield* Clock.currentTimeMillis);
    return yield* db.withTransaction(
      Effect.gen(function* () {
        const tx = yield* Tx;
        const [current] = yield* Effect.promise(() =>
          tx
            .select({ rowVersion: clients.rowVersion })
            .from(clients)
            .where(eq(clients.id, input.clientId))
            .for("update"),
        );
        if (current === undefined) return yield* notFound();
        const updated = yield* Effect.promise(() =>
          tx
            .update(clients)
            .set({
              // Always one column, so an edit that names no field is still a versioned update.
              updatedAt: now,
              ...(input.name === undefined ? {} : { name: input.name }),
              ...(input.contacts === undefined ? {} : { contacts: jsonb(input.contacts) }),
              ...(input.status === undefined
                ? {}
                : { status: input.status, archivedAt: input.status === "archived" ? now : null }),
              ...(input.proofConsent === undefined
                ? {}
                : { proofConsentAt: input.proofConsent ? now : null }),
            })
            .where(and(eq(clients.id, input.clientId), eq(clients.rowVersion, input.rowVersion)))
            .returning(),
        );
        const row = yield* requireUpdated(updated, current.rowVersion);
        yield* recordActivity({ userId, action: "clients.update", target: target(input.clientId) });
        return toClientDto(row);
      }),
    );
  });

/**
 * Routes 8 to 11 (the onboarding module owns `clients`, E12), with the Db and Idempotency
 * services from `services`. Every route needs the operator's session; writes go through the
 * request's Idempotency-Key.
 */
export function clientsRouter(services: Effect.Effect<Context.Context<Db | Idempotency>>) {
  const provided = <A, E, R>(program: Effect.Effect<A, E, R>) =>
    Effect.gen(function* () {
      return yield* Effect.provideContext(program, yield* services);
    });
  return {
    list: os.clients.list.handler(
      operatorHandler((input: ListClientsInput) => provided(list(input))),
    ),
    create: os.clients.create.handler(
      operatorHandler((input: CreateClientInput, caller) =>
        provided(
          idempotentWrite(caller, "POST /api/clients", input, 201, create(input, caller.userId)),
        ),
      ),
    ),
    get: os.clients.get.handler(operatorHandler((input: ClientIdInput) => provided(get(input)))),
    update: os.clients.update.handler(
      operatorHandler((input: UpdateClientInput, caller) =>
        provided(
          idempotentWrite(
            caller,
            "PATCH /api/clients/{clientId}",
            input,
            200,
            update(input, caller.userId),
          ),
        ),
      ),
    ),
  };
}

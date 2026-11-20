import { ConfigProvider, type Context, Effect, Layer, ManagedRuntime } from "effect";
import { clientsRouter } from "../onboarding/clients/routes.ts";
import { type Db, DbLive } from "./db/db.ts";
import { healthRouter } from "./health.ts";
import { type Idempotency, IdempotencyLive } from "./idempotency.ts";

/**
 * The services routes 8 to 11 use: `services`, built and released by the owner (startServer's
 * scope), or their own pool on `databaseUrl`, whose other settings come from the environment
 * and which lives as long as the process.
 */
export type RouterOptions =
  | { readonly services: Context.Context<Db | Idempotency> }
  | { readonly databaseUrl: string };

/** Db and Idempotency on their own pool, built on the first request that needs them. */
const ownServices = (databaseUrl: string) =>
  ManagedRuntime.make(
    Layer.orDie(
      IdempotencyLive.pipe(
        Layer.provideMerge(DbLive),
        Layer.provide(
          ConfigProvider.layerAdd(ConfigProvider.fromUnknown({ DATABASE_URL: databaseUrl }), {
            asPrimary: true,
          }),
        ),
      ),
    ),
  ).contextEffect;

/** The contract's procedures, for createApp: route 6, and routes 8 to 11. */
export function makeRouter(options: RouterOptions) {
  const services =
    "services" in options ? Effect.succeed(options.services) : ownServices(options.databaseUrl);
  return { ...healthRouter, clients: clientsRouter(services) };
}

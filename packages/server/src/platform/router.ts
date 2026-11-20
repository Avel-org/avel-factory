import { ConfigProvider, Layer, ManagedRuntime } from "effect";
import { clientsRouter } from "../onboarding/clients/routes.ts";
import { DbLive } from "./db/db.ts";
import { healthRouter } from "./health.ts";
import { IdempotencyLive } from "./idempotency.ts";

export interface RouterOptions {
  /** The database routes 8 to 11 use; DbLive's other settings still come from the environment. */
  readonly databaseUrl: string;
}

/**
 * The contract's procedures, for createApp: route 6, and routes 8 to 11. Their Db and
 * Idempotency services are built once, on the first request that needs them, and kept for the
 * life of the process: one pool for every request.
 */
export function makeRouter(options: RouterOptions) {
  const services = ManagedRuntime.make(
    Layer.orDie(
      IdempotencyLive.pipe(
        Layer.provideMerge(DbLive),
        Layer.provide(
          ConfigProvider.layerAdd(
            ConfigProvider.fromUnknown({ DATABASE_URL: options.databaseUrl }),
            {
              asPrimary: true,
            },
          ),
        ),
      ),
    ),
  );
  return { ...healthRouter, clients: clientsRouter(services.contextEffect) };
}

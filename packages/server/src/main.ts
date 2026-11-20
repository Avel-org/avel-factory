import { serve } from "@hono/node-server";
import { createApp } from "./platform/app.ts";
import { makeRouter } from "./platform/router.ts";

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is not set");
serve({ fetch: createApp({ router: makeRouter({ databaseUrl }) }).fetch, port });

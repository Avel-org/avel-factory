import { serve } from "@hono/node-server";
import { createApp } from "./platform/app.ts";

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: createApp().fetch, port });

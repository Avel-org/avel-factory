import { startServer } from "./server.ts";

const server = await startServer(process.env);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void server.close();
  });
}

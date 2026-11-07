// Stands in for the dev server while the app isn't built (see playwright.config.ts): it answers 403
// to everything, as a server with no routes, no page and no mock would. So the tests fail on their
// assertions (POST /__mock/reset isn't a 204) and not on a dev server that won't start.
// Never used once src/router.tsx and packages/contract-mock both exist.
import { createServer } from "node:http";

const port = Number(process.argv[2]);
createServer((_req, res) => {
  res.statusCode = 403;
  res.setHeader("content-type", "text/plain");
  res.end("not built");
}).listen(port, "127.0.0.1");

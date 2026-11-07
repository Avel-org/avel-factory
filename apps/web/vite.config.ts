import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, type Plugin } from "vite";

// The @avel/contract version this web is built with (UI contract section 3, escalation 02).
// Read from packages/contract/package.json at config time until @avel/contract exports
// CONTRACT_VERSION itself; the data core exposes it as BUILT_CONTRACT_VERSION.
function readContractVersion(): string {
  const file = new URL("../../packages/contract/package.json", import.meta.url);
  const pkg: unknown = JSON.parse(readFileSync(file, "utf8"));
  const version =
    typeof pkg === "object" && pkg !== null && "version" in pkg ? pkg.version : undefined;
  if (typeof version !== "string" || version === "") {
    throw new Error(`${file.pathname} has no version, so __AVEL_CONTRACT_VERSION__ can't be set`);
  }
  return version;
}

const contractVersion = readContractVersion();

async function readBody(req: IncomingMessage): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return chunks.length > 0 ? Uint8Array.from(Buffer.concat(chunks)) : undefined;
}

async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    for (const one of Array.isArray(value) ? value : [value]) headers.append(name, one);
  }
  const body = await readBody(req);
  return new Request(url, { method: req.method ?? "GET", headers, body });
}

async function sendResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  for (const [name, value] of response.headers) {
    if (name !== "set-cookie") res.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader("set-cookie", cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

// AVEL_API=mock (UI contract section 6): one contract mock for the whole dev server, seeded
// with fixtures.step1. It serves /api/* for the browser and the SSR loaders alike, plus the
// dev-only /__mock/bump/{proposalId} and /__mock/reset paths for the end-to-end tests.
// apply: "serve" keeps it, and the mock, out of every production build.
function contractMock(): Plugin {
  return {
    name: "avel:contract-mock",
    apply: "serve",
    async configureServer(server) {
      const { createMock, fixtures } = await import("@avel/contract-mock");
      const mock = createMock({ contractVersion });
      mock.seed(fixtures.step1);

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "/").split("?")[0] ?? "/";
        try {
          if (path === "/api" || path.startsWith("/api/")) {
            await sendResponse(res, await mock.fetch(await toRequest(req)));
            return;
          }
          if (path === "/__mock/reset" && req.method === "POST") {
            mock.reset();
            mock.seed(fixtures.step1);
            res.statusCode = 204;
            res.end();
            return;
          }
          const bump = /^\/__mock\/bump\/([^/]+)$/.exec(path);
          if (bump?.[1] !== undefined && req.method === "POST") {
            const version = mock.bumpVersion(decodeURIComponent(bump[1]));
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ version }));
            return;
          }
          if (path === "/__mock" || path.startsWith("/__mock/")) {
            res.statusCode = 404;
            res.end();
            return;
          }
        } catch (error) {
          next(error);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  define: {
    __AVEL_CONTRACT_VERSION__: JSON.stringify(contractVersion),
  },
  plugins: [
    ...(process.env.AVEL_API === "mock" ? [contractMock()] : []),
    tailwindcss(),
    tanstackStart(),
  ],
});

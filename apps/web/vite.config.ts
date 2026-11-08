import { readdirSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
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

// The server-function stub (UI contract section 6, revision 10; size study, finding 04). Start's
// client always carries the client half of createServerFn, and through it all of seroval. The web
// has no server function: every call goes through the oRPC client (FM line 30). So in the client
// environment only, these modules, when start-client-core imports them, resolve to stubs that
// throw if called. The server build is untouched.
const serverFnStubs: Record<string, string> = {
  "serverFnFetcher.js": [
    "export function serverFnFetcher() { throw new Error(STUBBED); }",
    // The real one is a no-op outside a server function's response, which the web never reads.
    "export function trackPostProcessPromise() {}",
  ].join("\n"),
  "createClientRpc.js": "export function createClientRpc() { throw new Error(STUBBED); }",
  "frame-decoder.js": "export function createFrameDecoder() { throw new Error(STUBBED); }",
};
const serverFnStubPrefix = "\0avel:server-fn-stub:";
const clientRpcDir = ["", "@tanstack", "start-client-core", "dist", "esm", "client-rpc", ""].join(
  sep,
);
// What the stub keeps out of the client: the real client-rpc modules, and seroval through them.
const serverFnOnlyModules = [
  ...Object.keys(serverFnStubs).map((file) => clientRpcDir + file),
  ["", "node_modules", "seroval", ""].join(sep),
  ["", "node_modules", "seroval-plugins", ""].join(sep),
];
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

// The guard: the build fails if createServerFn appears anywhere under apps/web/src. A server
// function needs the stub off, and that's a decision for the contract.
function serverFnGuard(): Plugin {
  return {
    name: "avel:server-fn-guard",
    buildStart() {
      const found = filesUnder(srcDir).filter((file) =>
        readFileSync(file, "utf8").includes("createServerFn"),
      );
      if (found.length > 0) {
        this.error(
          `createServerFn appears in ${found.map((file) => relative(srcDir, file)).join(", ")} ` +
            "under apps/web/src, but vite.config.ts stubs Start's server-function client " +
            "(UI contract section 6). Taking the stub off is a contract decision.",
        );
      }
    },
  };
}

function serverFnStub(): Plugin {
  const used = new Set<string>();
  return {
    name: "avel:server-fn-stub",
    enforce: "pre",
    applyToEnvironment: (environment) => environment.name === "client",
    buildStart() {
      used.clear();
    },
    resolveId(source, importer) {
      if (importer === undefined || !source.startsWith(".")) return null;
      const target = resolve(dirname(importer.split("?")[0] ?? importer), source);
      const at = target.lastIndexOf(clientRpcDir);
      if (at === -1 || !importer.includes(`${sep}start-client-core${sep}`)) return null;
      const file = target.slice(at + clientRpcDir.length);
      if (!(file in serverFnStubs)) return null;
      used.add(file);
      return serverFnStubPrefix + file;
    },
    load(id) {
      if (!id.startsWith(serverFnStubPrefix)) return null;
      const file = id.slice(serverFnStubPrefix.length);
      const message = `${file} is stubbed in apps/web/vite.config.ts: the web has no server functions (UI contract section 6)`;
      return `const STUBBED = ${JSON.stringify(message)};\n${serverFnStubs[file]}\n`;
    },
    // The alarm: a Start upgrade that renames or rewires these modules would otherwise bring the
    // 11 kB back without a sign. In start-client-core 1.170.39 the client reaches the three only
    // through createClientRpc.js, so its stub is the one used, and the other two never load. So
    // the alarm reads the client's output: no stub used, or any real client-rpc module or seroval
    // in a client chunk, fails the build.
    generateBundle(_options, bundle) {
      const leaked = new Set<string>();
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;
        for (const id of chunk.moduleIds) {
          if ((chunk.modules[id]?.renderedLength ?? 0) === 0) continue;
          if (serverFnOnlyModules.some((path) => id.includes(path))) leaked.add(id);
        }
      }
      if (used.size === 0 || leaked.size > 0) {
        this.error(
          "The server-function stub no longer holds in the client build " +
            `(stubs used: ${[...used].join(", ") || "none"}; ` +
            `server-function code in the client: ${[...leaked].join(", ") || "none"}). ` +
            "@tanstack/start-client-core has changed: update the stub (UI contract section 6).",
        );
      }
    },
  };
}

export default defineConfig({
  define: {
    __AVEL_CONTRACT_VERSION__: JSON.stringify(contractVersion),
  },
  plugins: [
    ...(process.env.AVEL_API === "mock" ? [contractMock()] : []),
    serverFnGuard(),
    serverFnStub(),
    tailwindcss(),
    tanstackStart(),
    // After tanstackStart(), as TanStack Start documents: the React Refresh runtime dev needs to hydrate.
    react(),
  ],
});

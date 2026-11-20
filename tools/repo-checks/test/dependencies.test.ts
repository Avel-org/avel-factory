import { describe, expect, test } from "vitest";
import { readRepoFile } from "./helpers.ts";

type Manifest = {
  name?: string;
  private?: boolean;
  type?: string;
  sideEffects?: unknown;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const manifest = (path: string): Manifest => JSON.parse(readRepoFile(path));

// The approved list (T-B0's notes from the lead; Javaris approves it, E5). Exact versions.
const SERVER = {
  dependencies: {
    "@avel/contract": "workspace:*",
    "@hono/node-server": "2.1.5",
    "@orpc/openapi": "1.16.2",
    "@orpc/server": "1.16.2",
    effect: "4.1.1",
    hono: "4.13.16",
    zod: "4.6.7",
  },
  devDependencies: {
    "@effect/tsgo": "0.64.1",
    "@effect/vitest": "4.1.1",
  },
};

const WEB = {
  dependencies: {
    "@avel/contract": "workspace:*",
    "@orpc/client": "1.16.2",
    "@orpc/openapi-client": "1.16.2",
    "@tanstack/react-router": "1.170.46",
    "@tanstack/react-start": "1.169.4",
    clsx: "2.1.1",
    react: "19.3.1",
    "react-dom": "19.3.1",
    "tailwind-merge": "3.7.0",
  },
  devDependencies: {
    "@avel/contract-mock": "workspace:*",
    "@axe-core/playwright": "4.14.0",
    "@playwright/test": "1.64.1",
    "@tailwindcss/vite": "4.3.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    tailwindcss: "4.3.3",
    vite: "8.3.8",
  },
};

describe("dependencies (E5)", () => {
  test("the server and web manifests pin the approved packages at exact versions", () => {
    const server = manifest("packages/server/package.json");
    const web = manifest("apps/web/package.json");

    expect(server.name).toBe("@avel/server");
    expect(web.name).toBe("@avel/web");

    expect(server.dependencies).toMatchObject(SERVER.dependencies);
    expect(server.devDependencies).toMatchObject(SERVER.devDependencies);
    expect(web.dependencies).toMatchObject(WEB.dependencies);
    expect(web.devDependencies).toMatchObject(WEB.devDependencies);

    // no range anywhere: a version is a number, or workspace:*
    for (const m of [server, web]) {
      for (const [dep, version] of Object.entries({
        ...m.dependencies,
        ...m.devDependencies,
      })) {
        expect(version, dep).not.toMatch(/^[\^~><*]|latest/);
      }
    }
  });

  test("T-B2-01: the server pins @effect/tsgo 0.64.1 and no longer lists @effect/language-service (CR-39)", () => {
    const server = manifest("packages/server/package.json");
    expect(server.devDependencies?.["@effect/tsgo"]).toBe("0.64.1");
    expect(server.devDependencies).not.toHaveProperty("@effect/language-service");
    expect(server.dependencies).not.toHaveProperty("@effect/language-service");
    // `pnpm why @effect/language-service` must print nothing: no importer and no package entry
    const lock = readRepoFile("pnpm-lock.yaml");
    expect(lock).not.toMatch(/@effect\/language-service/);
    expect(lock).toMatch(/'?@effect\/tsgo'?:\s*\n\s+specifier: 0\.64\.1/);
  });

  test("T-B2-02: the server lists @avel/db, drizzle-orm, pg and @types/pg at the versions packages/db pins", () => {
    const server = manifest("packages/server/package.json");
    const db = manifest("packages/db/package.json");
    expect(server.dependencies?.["@avel/db"]).toBe("workspace:*");
    for (const dep of ["drizzle-orm", "pg"]) {
      expect(db.dependencies?.[dep], `${dep} in packages/db`).toBeDefined();
      expect(server.dependencies?.[dep], dep).toBe(db.dependencies?.[dep]);
    }
    expect(db.devDependencies?.["@types/pg"]).toBeDefined();
    expect(server.devDependencies?.["@types/pg"]).toBe(db.devDependencies?.["@types/pg"]);
    // the versions the ticket names, so a change in packages/db can't move both unnoticed
    expect(server.dependencies).toMatchObject({ "drizzle-orm": "0.45.4", pg: "8.23.1" });
    expect(server.devDependencies).toMatchObject({ "@types/pg": "8.23.1" });
  });

  test("apps/web has exactly the scripts dev, preview, test and e2e, plus T-F10's check:contract, and sideEffects for css", () => {
    const web = manifest("apps/web/package.json");
    expect(web.private).toBe(true);
    expect(web.type).toBe("module");
    // T-F10-01 (frontend sprint-11) adds one script, the export's contract check, and nothing else.
    // It may be absent until T-F10 lands; when present it must be exactly this.
    const { "check:contract": checkContract, ...scripts } = web.scripts ?? {};
    expect(scripts).toEqual({
      dev: "vite dev",
      preview: "vite preview",
      test: "vitest run",
      e2e: "playwright test",
    });
    if (checkContract !== undefined) {
      expect(checkContract).toBe("node control-room/tools/check-contract.mjs");
    }
    expect(web.scripts).not.toHaveProperty("build");
    expect(web.scripts).not.toHaveProperty("typecheck");
    expect(web.sideEffects).toEqual(["**/*.css"]);
  });

  test("pnpm-lock.yaml holds no esbuild below 0.25", () => {
    const lock = readRepoFile("pnpm-lock.yaml");
    // `esbuild@0.18.20:` keys, and `esbuild@0.28.2` in peer suffixes. `@esbuild/<os>@x` and
    // other packages that end in "esbuild" (the platform builds) are different packages.
    const versions = [...lock.matchAll(/(?<![\w@/-])esbuild@(\d+)\.(\d+)\.(\d+)/g)].map((m) => ({
      text: `${m[1]}.${m[2]}.${m[3]}`,
      major: Number(m[1]),
      minor: Number(m[2]),
    }));
    expect(versions.length).toBeGreaterThan(0);
    const old = versions.filter((v) => v.major === 0 && v.minor < 25).map((v) => v.text);
    expect([...new Set(old)]).toEqual([]);
  });
});

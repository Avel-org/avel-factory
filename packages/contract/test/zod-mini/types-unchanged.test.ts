import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENTRY, entryExists, loadContract, PKG_ROOT, run } from "../helpers/contract.ts";

// RIGG-02 (S1-6): z.input and z.output of every zod schema the contract's entry exports are
// unchanged by the move to zod/mini.
//
// fixtures/zod-types.snapshot.ts holds those types as plain TypeScript, taken from the
// classic-zod contract before the move (regenerate: test/scripts/gen-zod-type-snapshot.mjs).
// The comparison is a type-level one: a fixture program is compiled with tsc, and for each
// schema it requires the live `input<typeof Schema>` and `output<typeof Schema>` to be
// assignable to the snapshot's type and the snapshot's to the live one (equal in both
// directions), and neither to be any. Printed text is never compared, so a difference in how
// classic and mini print a type is not a failure.
//
// `input` and `output` come from zod/v4/core, which classic and mini share.

const SNAPSHOT = join(PKG_ROOT, "test", "fixtures", "zod-types.snapshot.ts");
const q = (s: string) => JSON.stringify(s);

const HELPERS = `import type { input, output } from "zod/v4/core";
type IsAny<T> = 0 extends 1 & T ? true : false;
// true when A and B are assignable to each other and neither is any; otherwise an object type
// that names the schema, so the compiler error names it.
type Same<A, B, Name extends string> =
  IsAny<A> extends true ? { schemaTypeIsAny: Name }
  : IsAny<B> extends true ? { snapshotTypeIsAny: Name }
  : [A] extends [B] ? ([B] extends [A] ? true : { schemaTypeWiderThanSnapshot: Name })
  : { schemaTypeNotAssignableToSnapshot: Name };
`;

type Compiled = { status: number | null; errors: string[] };

function compile(source: string): Compiled {
  // Inside the package, so `zod/v4/core` resolves the way the contract's own imports do.
  const dir = mkdtempSync(join(PKG_ROOT, "test", ".types-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
    writeFileSync(join(dir, "fixture.ts"), source);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        extends: join(PKG_ROOT, "..", "..", "tsconfig.base.json"),
        compilerOptions: {
          noEmit: true,
          allowImportingTsExtensions: true,
          typeRoots: [join(PKG_ROOT, "..", "..", "node_modules", "@types")],
        },
        files: ["fixture.ts"],
      }),
    );
    const result = run(
      join(PKG_ROOT, "..", "..", "node_modules", ".bin", "tsc"),
      [
        "-p",
        join(dir, "tsconfig.json"),
        "--pretty",
        "false",
        "--noErrorTruncation",
        "--singleThreaded",
      ],
      dir,
    );
    return {
      status: result.status,
      errors: result.output.split("\n").filter((l) => /error TS\d+/.test(l)),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function snapshotNames(): string[] {
  const text = readFileSync(SNAPSHOT, "utf8");
  return [...text.matchAll(/^export declare const (\w+)__input\b/gm)].map((m) => m[1] as string);
}

function snapshotCount(): number {
  const m = readFileSync(SNAPSHOT, "utf8").match(/^\/\/ SCHEMA_COUNT=(\d+)$/m);
  return m ? Number(m[1]) : -1;
}

function schemaNamesOf(mod: Record<string, unknown>): string[] {
  return Object.entries(mod)
    .filter(([, v]) => typeof v === "object" && v !== null && "_zod" in v)
    .map(([k]) => k)
    .sort();
}

const COUNT = 186;
// tsc runs single-threaded here so it does not starve the locked build test; give it room.
const TSC_TIMEOUT = 120_000;

describe(`RIGG-02 (S1-6): z.input and z.output of the ${COUNT} exported schemas are unchanged`, () => {
  it(`RIGG-02 (pins existing behaviour: passes on classic): the snapshot covers exactly the ${COUNT} zod schemas the contract's entry exports`, async () => {
    expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
    const live = schemaNamesOf(await loadContract());
    const snap = snapshotNames();
    console.info(`RIGG-02: ${live.length} schemas exported, ${snap.length} in the snapshot`);
    expect(snapshotCount()).toBe(COUNT);
    expect(live.length).toBe(COUNT);
    expect([...snap].sort()).toEqual(live);
  });

  it("RIGG-02 (harness self-check, passes on classic): a changed field type is reported with the schema's name", () => {
    const result = compile(`${HELPERS}
import type * as S from ${q(SNAPSHOT)};
type Changed = Omit<typeof S.DecideProposalInput__input, "version"> & { version: string };
export const probe: Same<Changed, typeof S.DecideProposalInput__input, "DecideProposalInput input"> = true;
export const same: Same<typeof S.DecideProposalInput__input, typeof S.DecideProposalInput__input, "DecideProposalInput input"> = true;
`);
    expect(result.status).not.toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(
      'schemaTypeNotAssignableToSnapshot: "DecideProposalInput input"',
    );
  });

  it(
    `RIGG-02 (pins existing behaviour: passes on classic): input and output types of all ${COUNT} schemas equal the classic snapshot, both directions`,
    async () => {
      expect(entryExists(), "packages/contract/src/index.ts does not exist yet").toBe(true);
      const names = snapshotNames();
      expect(names.length).toBe(COUNT);
      const lines = names.flatMap((n) => [
        `export const ${n}__i: Same<input<typeof C.${n}>, typeof S.${n}__input, ${q(`${n} input`)}> = true;`,
        `export const ${n}__o: Same<output<typeof C.${n}>, typeof S.${n}__output, ${q(`${n} output`)}> = true;`,
      ]);
      const result = compile(
        `${HELPERS}import type * as C from ${q(ENTRY)};\nimport type * as S from ${q(SNAPSHOT)};\n${lines.join("\n")}\n`,
      );
      expect(result.errors).toEqual([]);
      expect(result.status).toBe(0);
    },
    TSC_TIMEOUT,
  );
});

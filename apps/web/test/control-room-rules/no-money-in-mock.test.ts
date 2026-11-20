import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { crRoot, filesUnder } from "../control-room/support";

const mockDir = join(crRoot, "src", "mock");
/** A key that names money: price, margin, invoice, payment, in any case or style. */
const MONEY_KEY =
  /^(price|margin|invoice|payment)|(Price|Margin|Invoice|Payment)|_(price|margin|invoice|payment)/;
/** A dollar amount: "$12", "$ 1,200.50", "USD 5". */
const DOLLARS = /\$\s?\d|\bUSD\b/;

function* entries(
  value: unknown,
  path: string,
): Generator<{ path: string; key?: string; text?: string }> {
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) yield* entries(v, `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      yield { path: `${path}.${k}`, key: k };
      yield* entries(v, `${path}.${k}`);
    }
  } else if (typeof value === "string") {
    yield { path, text: value };
  }
}

describe("T-F10-02: the sample world holds no money (E15)", () => {
  const files = filesUnder(mockDir);
  it("the sample world is there to be checked", () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    it(`${file} has no '$' amount and no price, margin, invoice or payment field`, () => {
      const raw = readFileSync(join(mockDir, file), "utf8");
      const offenders: string[] = [];
      for (const e of entries(JSON.parse(raw), file)) {
        if (e.key && MONEY_KEY.test(e.key)) offenders.push(`field ${e.path}`);
        if (e.text && DOLLARS.test(e.text))
          offenders.push(`amount ${e.path}: ${e.text.slice(0, 60)}`);
      }
      expect(offenders).toEqual([]);
    });
  }
});

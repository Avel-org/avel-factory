import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cn } from "../src/lib/utils";

const web = join(import.meta.dirname, "..");
const handoff = join(web, "..", "..", "docs", "ui-reference", "control-room-handoff");

describe("T-F1-04: tokens, shadcn init and cn()", () => {
  it("src/styles/tokens.css is byte for byte the handoff's", () => {
    const mine = readFileSync(join(web, "src", "styles", "tokens.css"));
    const theirs = readFileSync(join(handoff, "tokens.css"));
    expect(mine.equals(theirs)).toBe(true);
  });

  it("components.json points at src/styles/app.css with the @/ alias", () => {
    const config = JSON.parse(readFileSync(join(web, "components.json"), "utf8")) as {
      tailwind: { css: string };
      aliases: { utils: string; components: string };
    };
    expect(config.tailwind.css).toBe("src/styles/app.css");
    expect(config.aliases.utils).toBe("@/lib/utils");
    expect(config.aliases.components.startsWith("@/")).toBe(true);
  });

  it("app.css imports tokens.css, not tailwindcss itself, and maps shadcn's variables to --av-* values", () => {
    const css = readFileSync(join(web, "src", "styles", "app.css"), "utf8");
    // tokens.css already has `@import "tailwindcss"`: importing it here too would load it twice.
    expect(css).not.toMatch(/@import\s+(?:url\(\s*)?["']?tailwindcss/);
    expect(css).toMatch(/@import\s+["']\.\/tokens\.css["']/);
    for (const name of ["background", "foreground", "primary", "border", "ring"]) {
      expect(css, `--${name}`).toMatch(new RegExp(`--${name}\\s*:[^;]*var\\(--av-`));
    }
    // light and night both follow data-theme, not a second set of hard-coded colours
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("cn() merges conflicting Tailwind classes and drops falsy ones", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn("p-2", { "font-bold": true, italic: false })).toBe("p-2 font-bold");
  });
});

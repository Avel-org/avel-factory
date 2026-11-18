import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const webRoot = join(import.meta.dirname, "..", "..");
export const crRoot = join(webRoot, "control-room");
/** The export on the desktop: read as data, never run. May be absent on CI. */
export const EXPORT_ROOT = "/mnt/c/Users/javar/Desktop/avel-control-room";

/** Every file under `dir`, as a path relative to `base`, with forward slashes. */
export function filesUnder(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? filesUnder(path, base)
      : [relative(base, path).split("\\").join("/")];
  });
}

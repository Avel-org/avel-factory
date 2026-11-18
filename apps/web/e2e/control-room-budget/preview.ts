import { type ChildProcess, execFile, spawn } from "node:child_process";
import { join } from "node:path";
import { PREVIEW_PORT } from "../support/ports";

const root = join(import.meta.dirname, "..", "..");
const STARTUP_MS = 60_000;
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escape codes
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

export const ORIGIN = `http://127.0.0.1:${PREVIEW_PORT}`;

function build(): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "pnpm",
      ["exec", "vite", "build"],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 },
      (err, out, errOut) =>
        err ? reject(new Error(`vite build failed:\n${out}\n${errOut}`)) : resolve(),
    );
  });
}

/** Builds for production once, then serves it with `vite preview`. `stop` kills the server. */
export function productionPreview() {
  let child: ChildProcess | undefined;
  let ready: Promise<void> | undefined;
  const start = () =>
    new Promise<void>((resolve, reject) => {
      child = spawn(
        "pnpm",
        [
          "exec",
          "vite",
          "preview",
          "--host",
          "127.0.0.1",
          "--port",
          String(PREVIEW_PORT),
          "--strictPort",
        ],
        { cwd: root, env: { ...process.env, AVEL_API: "", NO_COLOR: "1", FORCE_COLOR: "0" } },
      );
      let seen = "";
      const timer = setTimeout(() => {
        child?.kill();
        reject(new Error(`vite preview did not start within ${STARTUP_MS} ms:\n${seen}`));
      }, STARTUP_MS);
      const onData = (chunk: Buffer) => {
        seen += chunk.toString().replace(ANSI, "");
        if (seen.includes(`:${PREVIEW_PORT}`)) {
          clearTimeout(timer);
          resolve();
        }
      };
      child.stdout?.on("data", onData);
      child.stderr?.on("data", onData);
      child.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`vite preview exited (${code}):\n${seen}`));
      });
    });
  return {
    ensure(): Promise<void> {
      ready ??= build().then(start);
      return ready;
    },
    stop() {
      child?.removeAllListeners("exit");
      child?.kill();
    },
  };
}

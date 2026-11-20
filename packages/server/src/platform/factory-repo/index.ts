import { execFile } from "node:child_process";
import { ConfigProvider, Data, Effect, Layer, ManagedRuntime } from "effect";
import { FactoryVersions, isCommitSha } from "../../knowledge/index.ts";
import { Db, DbLive } from "../db/db.ts";

/** A commit with no factory_versions row, or one the factory's App didn't merge: never read. */
export class FactoryShaRefused extends Data.TaggedError("FactoryShaRefused")<{
  sha: string;
  message: string;
}> {}

/** A merged commit with no factory.yaml at the repo root. */
export class FactoryYamlMissing extends Data.TaggedError("FactoryYamlMissing")<{
  sha: string;
  message: string;
}> {}

/** The mirror's fetch for a commit it lacked ran past its timeout, and was stopped. */
export class FactoryFetchTimeout extends Data.TaggedError("FactoryFetchTimeout")<{
  sha: string;
  message: string;
}> {}

/** The mirror's fetch failed, or ended without the commit. */
export class FactoryFetchFailed extends Data.TaggedError("FactoryFetchFailed")<{
  sha: string;
  message: string;
}> {}

export type FactoryRepoError =
  | FactoryShaRefused
  | FactoryYamlMissing
  | FactoryFetchTimeout
  | FactoryFetchFailed;

export interface FactoryRepoOptions {
  readonly databaseUrl: string;
  /** A local mirror (`git clone --mirror`) of the factory repo. */
  readonly mirrorPath: string;
  /** The git executable to run; defaults to "git". */
  readonly git?: string;
  /** How long a fetch of the mirror may run, on the Clock; defaults to 30 seconds. */
  readonly fetchTimeoutMs?: number;
}

export interface FactoryRepo {
  /** factory.yaml's text at a commit the factory's App merged; it isn't parsed here (E8). */
  readonly readFactoryYaml: (sha: string) => Effect.Effect<string, FactoryRepoError>;
  /** Ends the database pool. */
  readonly close: () => Promise<void>;
}

const FILE = "factory.yaml";
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
/** Reads inside the local mirror, stopped by the child process's own timer if they hang. */
const READ_TIMEOUT_MS = 10_000;

interface GitResult {
  readonly code: number;
  readonly stdout: string;
}

/**
 * One git command as a child process (no git library). A non-zero exit is a result; a git that
 * can't start, or a read past its timer, is a defect. An interruption kills the process.
 */
const runGit = (git: string, args: readonly string[], timeout?: number) =>
  Effect.callback<GitResult>((resume) => {
    const child = execFile(
      git,
      args,
      // Never wait on a credential prompt.
      { encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout },
      (error, stdout) => {
        if (error === null) return resume(Effect.succeed({ code: 0, stdout }));
        if (typeof error.code === "number") {
          return resume(Effect.succeed({ code: error.code, stdout }));
        }
        resume(Effect.die(new Error(`git ${args.join(" ")} failed: ${error.message}`)));
      },
    );
    return Effect.sync(() => {
      child.kill("SIGKILL");
    });
  });

/**
 * The factory repo loader (Step 1 item 11): factory.yaml at a merged commit, from a local mirror,
 * fetched only when it lacks the commit.
 */
export function makeFactoryRepo(options: FactoryRepoOptions): FactoryRepo {
  const git = options.git ?? "git";
  const fetchTimeoutMs = options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const inMirror = (...args: string[]) => [`--git-dir=${options.mirrorPath}`, ...args];
  const runtime = ManagedRuntime.make(
    DbLive.pipe(
      Layer.provide(
        ConfigProvider.layerAdd(
          ConfigProvider.fromEnvRecord({ DATABASE_URL: options.databaseUrl }),
          { asPrimary: true },
        ),
      ),
      Layer.orDie,
    ),
  );

  const isSelectable = (sha: string) =>
    Effect.gen(function* () {
      const read = Effect.gen(function* () {
        const db = yield* Db;
        // A read breaks no database rule, so any failure here is a defect.
        return yield* db.withTransaction(FactoryVersions.isSelectable(sha)).pipe(Effect.orDie);
      });
      return yield* Effect.provideContext(read, yield* runtime.contextEffect);
    });

  const hasCommit = (sha: string) =>
    runGit(git, inMirror("cat-file", "-e", `${sha}^{commit}`), READ_TIMEOUT_MS).pipe(
      Effect.map((result) => result.code === 0),
    );

  const fetch = (sha: string) =>
    Effect.gen(function* () {
      const result = yield* runGit(git, inMirror("fetch", "--quiet", "origin")).pipe(
        Effect.timeoutOrElse({
          duration: fetchTimeoutMs,
          orElse: () =>
            Effect.fail(
              new FactoryFetchTimeout({
                sha,
                message: `Fetching the factory mirror for ${sha} took over ${fetchTimeoutMs} ms`,
              }),
            ),
        }),
      );
      if (result.code !== 0 || !(yield* hasCommit(sha))) {
        return yield* new FactoryFetchFailed({
          sha,
          message: `The factory mirror's fetch didn't bring ${sha}`,
        });
      }
    });

  const readFactoryYaml = (sha: string) =>
    Effect.gen(function* () {
      if (!isCommitSha(sha) || !(yield* isSelectable(sha))) {
        return yield* new FactoryShaRefused({
          sha,
          message: `${sha} isn't a factory commit merged by the factory's App`,
        });
      }
      if (!(yield* hasCommit(sha))) yield* fetch(sha);
      const read = yield* runGit(
        git,
        inMirror("cat-file", "blob", `${sha}:${FILE}`),
        READ_TIMEOUT_MS,
      );
      if (read.code !== 0) {
        return yield* new FactoryYamlMissing({
          sha,
          message: `The factory commit ${sha} has no ${FILE} at its root`,
        });
      }
      return read.stdout;
    });

  return { readFactoryYaml, close: () => runtime.dispose() };
}

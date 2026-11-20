import { factoryVersions } from "@avel/db";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { Tx } from "../platform/db/db.ts";

/** A full git commit SHA: 40 hex characters (SHA-1), or 64 (SHA-256). */
export const isCommitSha = (value: string): boolean =>
  /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);

/** A merged commit of the factory repo, as the webhook saw its pull request merged. */
export interface FactoryMerge {
  readonly sha: string;
  readonly mergedAt: Date;
  /** The one operator's `users.id`. */
  readonly approvedBy: string;
  /** True only when the factory's GitHub App made the merge. */
  readonly mergedByApp: boolean;
  /** The pull request's title. */
  readonly summary: string;
  readonly prNumber: number;
}

export const FactoryVersions = {
  /** Lists a merged commit in `factory_versions` (Design v0.6, Factory as code). */
  record: (merge: FactoryMerge): Effect.Effect<void, never, Tx> =>
    Effect.gen(function* () {
      const tx = yield* Tx;
      yield* Effect.promise(() => tx.insert(factoryVersions).values(merge));
    }),

  /**
   * Whether a commit may be pinned: it has a `factory_versions` row and the factory's App made
   * its merge. Any other commit, merged or not, is never selectable.
   */
  isSelectable: (sha: string): Effect.Effect<boolean, never, Tx> =>
    Effect.gen(function* () {
      const tx = yield* Tx;
      const found = yield* Effect.promise(() =>
        tx
          .select({ mergedByApp: factoryVersions.mergedByApp })
          .from(factoryVersions)
          .where(eq(factoryVersions.sha, sha)),
      );
      return found[0]?.mergedByApp === true;
    }),
};

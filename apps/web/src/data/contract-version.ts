import { useSyncExternalStore } from "react";

/**
 * The contract version check's store (UI contract section 3; FM line 226). The fetch wrapper
 * reports each browser response's `X-Contract-Version` here, and the page reads the mismatch
 * with `useContractMismatch()`. It's module state, so only the browser writes it: the server
 * would share it across requests.
 */

declare const __AVEL_CONTRACT_VERSION__: string;

/**
 * The `@avel/contract` version this web was built with: `vite.config.ts` and `vitest.config.ts`
 * define it from `packages/contract/package.json` until `@avel/contract` exports a version
 * itself (escalation 02).
 */
export const BUILT_CONTRACT_VERSION: string = __AVEL_CONTRACT_VERSION__;

export interface ContractMismatch {
  serverVersion: string;
}

let mismatch: ContractMismatch | null = null;
const listeners = new Set<() => void>();

/**
 * Records a response's `X-Contract-Version`. A header that's absent, or equal to `expected`,
 * changes nothing. The first one that differs is kept until reload.
 */
export function noteContractVersion(serverVersion: string | null, expected: string): void {
  if (serverVersion === null || serverVersion === expected || mismatch !== null) return;
  mismatch = { serverVersion };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The server's version once a response differed from the built one, else null. */
export function useContractMismatch(): ContractMismatch | null {
  return useSyncExternalStore(
    subscribe,
    () => mismatch,
    () => null,
  );
}

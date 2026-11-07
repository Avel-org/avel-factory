// An inert stand-in for src/data/contract-version.ts (vitest.config.ts).

export const BUILT_CONTRACT_VERSION = "";

export function useContractMismatch(): { serverVersion: string } | null {
  return null;
}

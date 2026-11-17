import type { ApiClient } from "../data/client";

export type HomeState =
  | { kind: "ready"; count: number; more: boolean }
  | { kind: "empty" }
  | { kind: "error" };

/** Route 52's first page, as the Decisions page needs it. A failure is a state, never a throw. */
export async function loadHome(client: ApiClient): Promise<HomeState> {
  try {
    const page = await client.decisions.listPending({});
    if (!Array.isArray(page.items)) return { kind: "error" };
    if (page.items.length === 0) return { kind: "empty" };
    return { kind: "ready", count: page.items.length, more: page.nextCursor !== null };
  } catch {
    return { kind: "error" };
  }
}

export type HomeViewState =
  | { kind: "ready"; count: number; more: boolean }
  | { kind: "empty" }
  | { kind: "error" };

const heading = "text-[length:var(--av-desk-hero)] leading-[var(--av-desk-hero-lh)] font-medium";

export function HomeLoading() {
  return (
    <main className="mx-auto max-w-[var(--av-content-max)] p-6">
      <p role="status">Loading…</p>
    </main>
  );
}

export function HomeView({ state, onRetry }: { state: HomeViewState; onRetry: () => void }) {
  return (
    <main className="mx-auto max-w-[var(--av-content-max)] p-6">
      <h1 className={heading}>Decisions</h1>
      {state.kind === "ready" && (
        <p>{`${state.count}${state.more ? "+" : ""} waiting`}</p>
      )}
      {state.kind === "empty" && <p>Nothing needs you</p>}
      {state.kind === "error" && (
        <>
          <p role="alert">Couldn't load your decisions.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-11 rounded border border-border px-4 text-primary"
          >
            Try again
          </button>
        </>
      )}
    </main>
  );
}

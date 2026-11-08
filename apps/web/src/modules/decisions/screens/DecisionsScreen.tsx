import {
  QueryErrorResetBoundary,
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  Component,
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  newIdempotencyKey,
  type PendingDecisionRow,
  toUiError,
  type UiError,
  useApi,
  useContractMismatch,
} from "../../../data";
import {
  AV_ERROR_COPY,
  Button,
  DecisionTag,
  type DecisionTagProps,
  ErrorPanel,
  HashChip,
  type ReasonDialogProps,
  StatusGlyph,
  WidgetState,
} from "../../../kit";
import { formatClock } from "../../../lib/time";
import {
  type DecideVariables,
  decideMutationOptions,
  pendingDecisionsKey,
  pendingDecisionsOptions,
} from "../api";
import {
  approveDialogCopy,
  type DecidableProposal,
  factoryChangeTagProps,
  isDecidable,
  proposalTagProps,
  rejectDialogCopy,
} from "../decisions";

/**
 * The approval page at `/` (UI contract section 5): what's waiting (route 52), and approve or
 * reject with a reason (route 54). Server data comes only from the module's query options; the
 * page keeps UI state only (a row's dialog, its send in flight, the error it got back).
 */

// ---- copy (section 5; † strings are the contract's own) ----

const OFFLINE = "You're offline.";
const SETTLED_ELSEWHERE = "That decision was settled elsewhere.";
const REASON_REFUSED = "The server didn't accept this reason. Write a few more words.";
const UNREACHABLE = "Couldn't reach the server.";
const CONTRACT_UPDATED = "AVEL was updated. Reload to use the new version.";

const NOT_ALLOWED_REASON = {
  resolved: "This decision was already made.",
  expired: "This decision expired.",
  none: "This can't be decided now.",
  gone: "This decision no longer exists.",
} as const;

const COPY_400 = AV_ERROR_COPY[400] as { title: string; body: string };
const COPY_401 = AV_ERROR_COPY[401] as { title: string; body: string };

// ---- values (section 0's value rule: tokens, or DL's own literal for the element) ----

/** DL's Decisions screen breakpoint (`ROe(899)`). */
const PHONE_QUERY = "(max-width: 899px)";

/** `IDEMPOTENCY_IN_PROGRESS`: the same key is re-sent after 500ms, 1s and 2s (5.3). */
const IN_PROGRESS_WAITS = [500, 1000, 2000] as const;

/** Reads a duration token (`400ms`, `0.4s`) from the page's styles; 0 when it isn't there. */
function durationTokenMs(name: string): number {
  if (typeof document === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(raw);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2] === "s" ? value * 1000 : value;
}

/**
 * `ReasonDialog` isn't in the first load (section 5, "Styles and loading"): it's imported with
 * `React.lazy`, and the list starts fetching it once it has rendered, so the first tap doesn't
 * wait on the network. One promise, so the prefetch and the lazy component share one fetch.
 */
// The one import that reaches past kit/index.ts: a dynamic import of the index would land in the
// same chunk as the index's static importers, so the dialog would stay in the first load.
let reasonDialogModule: Promise<{ default: ComponentType<ReasonDialogProps> }> | null = null;
function loadReasonDialog() {
  reasonDialogModule ??= import("../../../kit/ReasonDialog").then(
    (kit) => ({ default: kit.ReasonDialog }),
    (error: unknown) => {
      // A failed fetch isn't kept: the next try (the dialog's own render) fetches again.
      reasonDialogModule = null;
      throw error;
    },
  );
  return reasonDialogModule;
}

/** The prefetch: a failure here is retried when the dialog renders, where it's thrown. */
function prefetchReasonDialog(): void {
  loadReasonDialog().catch(() => {});
}
const ReasonDialog = lazy(loadReasonDialog);

function reloadPage(): void {
  window.location.reload();
}

// ---- the browser's state: phone or desk, online or not ----

function subscribePhone(onChange: () => void): () => void {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Phone is DL's `max-width: 899px`. The server draws the desk; the browser corrects it. */
function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** `navigator.onLine` (5.2 step 5): offline disables every decision, and nothing is queued. */
function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

// ---- the hydration marker (section 5, revision 9; decisions-fenn-01) ----

function subscribeNever(): () => void {
  return () => {};
}

/**
 * False on the server and in the hydration render, true in every client render after it. For
 * tests only: nothing is styled on it.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** Sets the page's marker. It's only ever set, so it's passed down as a plain setter. */
type OnSettled = (settled: true) => void;

/**
 * The page's content reports that it has its final layout. `data-hydrated` goes on the page root
 * only then, in the commit after this one (decisions-fenn-01: the marker means a tap lands where
 * it's aimed). The list sits in its own Suspense boundary, which React hydrates in a later pass
 * than the page root, and its tags switch from the server's desk layout to the phone layout only
 * in the render after that hydration. So the root's own hydration is too early: the signal comes
 * from the content, from the first commit where it rendered with the browser's values.
 */
function useSettledOnClient(onSettled: OnSettled): void {
  const client = useHydrated();
  useLayoutEffect(() => {
    if (client) onSettled(true);
  }, [client, onSettled]);
}

/** For content with no `DecisionTag` (the loading and first-load error states). */
function Settled({ onSettled }: { onSettled: OnSettled }) {
  useSettledOnClient(onSettled);
  return null;
}

// ---- the page ----

type SignedOut = { requestId: string | null };

export function DecisionsScreen() {
  const mismatch = useContractMismatch();
  const [signedOut, setSignedOut] = useState<SignedOut | null>(null);
  // Absent from the server's HTML and the hydration render, so hydration doesn't mismatch.
  const [hydrated, setHydrated] = useState(false);

  return (
    <div
      data-ui="DecisionsPage"
      className="dec-page"
      {...(hydrated ? { "data-hydrated": "true" } : {})}
    >
      {/* 5.5: the contract version banner, above the header. */}
      {mismatch ? (
        <WidgetState
          state="staleVersion"
          message={CONTRACT_UPDATED}
          actionLabel="Reload"
          onAction={reloadPage}
        />
      ) : null}
      {signedOut ? (
        <>
          <PageHeader lead={null} />
          <SignedOutPanel requestId={signedOut.requestId} />
        </>
      ) : (
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <FirstLoadBoundary
              onReset={reset}
              fallback={(error, retry) => (
                <>
                  <PageHeader lead={null} />
                  <FirstLoadError error={error} onRetry={retry} />
                  <Settled onSettled={setHydrated} />
                </>
              )}
            >
              <Suspense
                fallback={
                  <>
                    <PageHeader lead={null} />
                    <WidgetState state="loading" />
                    <Settled onSettled={setHydrated} />
                  </>
                }
              >
                <DecisionsList onSignedOut={setSignedOut} onSettled={setHydrated} />
              </Suspense>
            </FirstLoadBoundary>
          )}
        </QueryErrorResetBoundary>
      )}
    </div>
  );
}

function PageHeader({ lead }: { lead: string | null }) {
  return (
    <header className="dec-head">
      <span className="dec-eyebrow">Home</span>
      <h1 className="dec-title">Decisions</h1>
      {lead ? <p className="dec-lead">{lead}</p> : null}
    </header>
  );
}

/** The lead line: DL's first sentence only (section 5, Layout). */
function leadLine(count: number): string {
  if (count === 0) return "Nothing needs you right now.";
  return count === 1 ? "1 thing needs you." : `${count} things need you.`;
}

/** 5.3 and 5.4's signed-out panel: DL's 401 copy, the request ID, and no action (E1). */
function SignedOutPanel({ requestId }: { requestId: string | null }) {
  return (
    <ErrorPanel
      code={401}
      title={COPY_401.title}
      body={COPY_401.body}
      {...(requestId ? { requestId } : {})}
    />
  );
}

// ---- route 52 with no data on screen (5.4) ----

interface FirstLoadBoundaryProps {
  onReset: () => void;
  fallback: (error: unknown, retry: () => void) => ReactNode;
  children: ReactNode;
}

/** Catches route 52's first-load error, which the suspense query throws when it has no data. */
class FirstLoadBoundary extends Component<
  FirstLoadBoundaryProps,
  { failed: boolean; error: unknown }
> {
  override state = { failed: false, error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, error };
  }

  retry = () => {
    this.props.onReset();
    this.setState({ failed: false, error: null });
  };

  override render() {
    return this.state.failed
      ? this.props.fallback(this.state.error, this.retry)
      : this.props.children;
  }
}

/** The HTTP status a thrown error carries (oRPC errors do), for the panel's code. */
function statusOf(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
}

/** The server's message, as the error carries it. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/** 5.4's titles: DL's for 400, 403 and 404, and 5.3's for 409 and 422. */
const FIRST_LOAD_TITLE: Record<number, string> = {
  409: "This couldn't be recorded.",
  422: "Not allowed now",
};

function FirstLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const ui = toUiError(error);
  const requestId = ui.requestId ?? undefined;
  if (ui.kind === "signedOut") return <SignedOutPanel requestId={ui.requestId} />;
  if (ui.kind === "network" || ui.kind === "server") {
    // DL's WidgetState error as it is: "Couldn't load", its message, the request ID and Retry.
    return <WidgetState state="error" onAction={onRetry} {...(requestId ? { requestId } : {})} />;
  }
  const code = statusOf(error) ?? 400;
  const title = FIRST_LOAD_TITLE[code];
  return (
    <ErrorPanel
      code={code}
      body={messageOf(error)}
      {...(title ? { title } : {})}
      {...(requestId ? { requestId } : {})}
    />
  );
}

// ---- the list ----

interface DecisionsListProps {
  onSignedOut: (value: SignedOut) => void;
  onSettled: OnSettled;
}

function DecisionsList({ onSignedOut, onSettled }: DecisionsListProps) {
  const api = useApi();
  const query = useSuspenseInfiniteQuery(pendingDecisionsOptions(api));
  const { rows, unreadable, nextCursor } = query.data;
  // One component reads both, so the render where `phone` first has the browser's value is the
  // render whose commit reports the final layout: every tag takes `layout` from here.
  const phone = useIsPhone();
  useSettledOnClient(onSettled);
  const online = useOnline();
  const [settledElsewhere, setSettledElsewhere] = useState(false);
  const headingId = useId();
  // 5.1: ages are measured against the latest successful route 52 fetch.
  const now = query.dataUpdatedAt;
  const failure = query.error ? toUiError(query.error) : null;
  const failedRequestId = failure?.requestId ?? undefined;

  // The list has rendered: start fetching the reason dialog, so the first tap doesn't wait on it.
  useEffect(() => {
    prefetchReasonDialog();
  }, []);

  /** Refetches route 52; true when the fresh list landed. */
  const refreshList = async (): Promise<boolean> => {
    const result = await query.refetch();
    return result.status === "success";
  };

  /** 5.3 `stale`: Review refetches; a row the server no longer lists was settled elsewhere. */
  const reviewRow = async (ref: string): Promise<boolean> => {
    const result = await query.refetch();
    if (result.status !== "success") return false;
    if (!result.data.rows.some((row) => row.ref === ref)) setSettledElsewhere(true);
    return true;
  };

  const count = rows.length;
  const more = nextCursor !== null;
  const empty = count === 0 && !more;
  const layout = phone ? "phone" : "desk";

  const list = (
    <ul aria-label="Waiting for you" className="dec-list">
      {rows.map((row) => (
        <li key={row.ref}>
          <RowView
            row={row}
            now={now}
            layout={layout}
            online={online}
            refreshList={refreshList}
            reviewRow={reviewRow}
            onSignedOut={onSignedOut}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader lead={leadLine(count)} />
      <section aria-labelledby={headingId} className="dec-sec">
        <div className="dec-sec-head">
          <h2 id={headingId} className="dec-h2">
            Waiting for you <span className="dec-count">{`${count}${more ? "+" : ""}`}</span>
          </h2>
        </div>
        {unreadable > 0 ? (
          <div role="alert" className="dec-band">
            {`${unreadable} ${unreadable === 1 ? "decision" : "decisions"} couldn't be shown. Reload the page; if it keeps happening, report it.`}
          </div>
        ) : null}
        {settledElsewhere ? (
          <div role="status" className="dec-band">
            {SETTLED_ELSEWHERE}
          </div>
        ) : null}
        {empty ? (
          <EmptyCard />
        ) : query.isRefetchError ? (
          // 5.4: a refetch failed with rows on screen. They stay, under the stale band.
          <WidgetState
            state="error"
            lastGoodAge={Date.now() - query.dataUpdatedAt}
            onAction={() => void query.refetch()}
            {...(failedRequestId ? { requestId: failedRequestId } : {})}
          >
            {list}
          </WidgetState>
        ) : (
          list
        )}
        {more ? (
          <div className="dec-more">
            <Button variant="secondary" onClick={() => void query.fetchNextPage()}>
              {query.isFetchNextPageError ? "Retry loading more" : "Load more"}
            </Button>
            {query.isFetchNextPageError && failedRequestId ? (
              <HashChip kind="hash" value={failedRequestId} length={12} prefix="req" />
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}

/** DL's empty card (`.dec-empty`): a done glyph, "Nothing needs you.", then the promise. */
function EmptyCard() {
  return (
    <div className="dec-empty">
      <StatusGlyph status="done" size={16} />
      <span>
        <strong>Nothing needs you.</strong> A decision appears here the moment the factory needs
        one.
      </span>
    </div>
  );
}

interface RowViewProps {
  row: PendingDecisionRow;
  now: number;
  layout: "desk" | "phone";
  online: boolean;
  refreshList: () => Promise<boolean>;
  reviewRow: (ref: string) => Promise<boolean>;
  onSignedOut: (value: SignedOut) => void;
}

function RowView({ row, now, layout, ...rest }: RowViewProps) {
  if (row.kind === "factory_change") {
    return <DecisionTag {...factoryChangeTagProps(row, now)} layout={layout} state="seen" />;
  }
  if (!isDecidable(row)) {
    return <DecisionTag {...proposalTagProps(row, now)} layout={layout} state="notAllowed" />;
  }
  return <ProposalDecision row={row} now={now} layout={layout} {...rest} />;
}

// ---- deciding one proposal (5.2 and 5.3) ----

type Effect = "approve" | "reject";

/** One intent: the row as it was drawn when tapped, the reason, and the key for every send. */
interface Attempt {
  row: DecidableProposal;
  effect: Effect;
  reason: string;
  vars: DecideVariables;
}

type Outcome =
  | { phase: "sending"; attempt: Attempt }
  | { phase: "approved"; approvedAt: string | undefined }
  | { phase: "rejected" }
  | { phase: "countdown"; secondsLeft: number; requestId: string | null }
  | { phase: "failed"; attempt: Attempt; error: UiError; message: string };

interface DialogState {
  row: DecidableProposal;
  effect: Effect;
  defaultReason?: string;
  error?: string;
  requestId?: string;
}

interface ProposalDecisionProps extends Omit<RowViewProps, "row"> {
  row: DecidableProposal;
}

function ProposalDecision({
  row,
  now,
  layout,
  online,
  refreshList,
  reviewRow,
  onSignedOut,
}: ProposalDecisionProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const mutation = useMutation(decideMutationOptions(api));
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  // 5.3 `rateLimited`: count down each second; at 0 the buttons come back. Nothing is re-sent.
  useEffect(() => {
    if (outcome?.phase !== "countdown") return;
    const timer = setTimeout(() => {
      setOutcome((current) =>
        current?.phase !== "countdown"
          ? current
          : current.secondsLeft > 1
            ? { ...current, secondsLeft: current.secondsLeft - 1 }
            : null,
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [outcome]);

  const later = (ms: number, run: () => void): void => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  };
  const wait = (ms: number) => new Promise<void>((resolve) => later(ms, resolve));

  const settle = (attempt: Attempt, thrown: unknown, error: UiError): void => {
    switch (error.kind) {
      case "signedOut":
        setOutcome(null);
        onSignedOut({ requestId: error.requestId });
        return;
      case "badRequest":
        if (error.field === "reason") {
          // The row goes back to seen, and the dialog reopens with the reason it sent.
          setOutcome(null);
          setDialog({
            row: attempt.row,
            effect: attempt.effect,
            defaultReason: attempt.reason,
            error: REASON_REFUSED,
            ...(error.requestId ? { requestId: error.requestId } : {}),
          });
          return;
        }
        break;
      case "rateLimited":
        if (error.retryAfterMs !== null) {
          const secondsLeft = Math.ceil(error.retryAfterMs / 1000);
          setOutcome(
            secondsLeft > 0
              ? { phase: "countdown", secondsLeft, requestId: error.requestId }
              : null,
          );
          return;
        }
        break;
    }
    setOutcome({ phase: "failed", attempt, error, message: messageOf(thrown) });
  };

  /** Sends one intent: the first send, or a Retry with the same body and the same key. */
  const send = async (attempt: Attempt): Promise<void> => {
    setOutcome({ phase: "sending", attempt });
    for (let resend = 0; ; resend += 1) {
      try {
        const decided = await mutation.mutateAsync(attempt.vars);
        setOutcome(
          attempt.effect === "approve"
            ? {
                phase: "approved",
                approvedAt: decided.resolvedAt ? formatClock(decided.resolvedAt) : undefined,
              }
            : { phase: "rejected" },
        );
        // After the punch, route 52 is refetched; the row leaves when the refetch lands.
        later(durationTokenMs("--av-d-punch"), () => {
          void queryClient.invalidateQueries({ queryKey: pendingDecisionsKey(api) });
        });
        return;
      } catch (thrown) {
        const error = toUiError(thrown);
        if (error.kind === "inProgress") {
          const delay = IN_PROGRESS_WAITS[resend];
          if (delay !== undefined) {
            await wait(delay);
            continue;
          }
          // Out of re-sends: shown as `network`, with the last request's ID.
          settle(attempt, thrown, {
            kind: "network",
            code: error.code,
            requestId: error.requestId,
          });
          return;
        }
        settle(attempt, thrown, error);
        return;
      }
    }
  };

  const confirm = (reason: string): void => {
    if (!dialog) return;
    const { row: drawn, effect } = dialog;
    setDialog(null);
    const choice = effect === "approve" ? drawn.approve.choice : drawn.reject.choice;
    void send({
      row: drawn,
      effect,
      reason,
      vars: {
        input: { proposalId: drawn.proposalId, version: drawn.version, choice, reason },
        idempotencyKey: newIdempotencyKey(),
      },
    });
  };

  /** Review and Refresh list: refetch, and when the row is still listed it's drawn fresh. */
  const afterRefetch = async (refetch: () => Promise<boolean>): Promise<void> => {
    if (await refetch()) setOutcome(null);
  };

  const tag: Partial<DecisionTagProps> & Pick<DecisionTagProps, "state"> = { state: "seen" };
  switch (outcome?.phase) {
    case "sending":
      tag.state = outcome.attempt.effect === "approve" ? "approving" : "rejecting";
      break;
    case "approved":
      tag.state = "approved";
      if (outcome.approvedAt) tag.approvedAt = outcome.approvedAt;
      break;
    case "rejected":
      tag.state = "rejected";
      break;
    case "countdown":
      tag.actionsDisabledReason = `Retry in ${outcome.secondsLeft}s`;
      if (outcome.requestId) tag.requestId = outcome.requestId;
      break;
    case "failed":
      Object.assign(
        tag,
        failureView(outcome, {
          retry: () => void send(outcome.attempt),
          review: () => void afterRefetch(() => reviewRow(row.ref)),
          refresh: () => void afterRefetch(refreshList),
        }),
      );
      break;
  }
  if (!online && tag.state !== "approved" && tag.state !== "rejected") {
    tag.actionsDisabledReason = OFFLINE;
  }

  const copy = dialog
    ? dialog.effect === "approve"
      ? approveDialogCopy(dialog.row)
      : rejectDialogCopy(dialog.row)
    : null;

  return (
    <>
      <DecisionTag
        {...proposalTagProps(row, now)}
        {...tag}
        layout={layout}
        onApprove={() => setDialog({ row, effect: "approve" })}
        onReject={() => setDialog({ row, effect: "reject" })}
      />
      {dialog && copy ? (
        <Suspense fallback={null}>
          <ReasonDialog
            open
            onClose={() => setDialog(null)}
            onConfirm={confirm}
            title={copy.title}
            description={copy.description}
            confirmLabel={copy.confirmLabel}
            destructive={false}
            minLength={3}
            {...(dialog.defaultReason !== undefined ? { defaultReason: dialog.defaultReason } : {})}
            {...(dialog.error ? { error: dialog.error } : {})}
            {...(dialog.requestId ? { requestId: dialog.requestId } : {})}
          />
        </Suspense>
      ) : null}
    </>
  );
}

interface FailureActions {
  retry: () => void;
  review: () => void;
  refresh: () => void;
}

/** 5.3, by `UiError.kind`: what the row draws for a failed send. */
function failureView(
  failed: Extract<Outcome, { phase: "failed" }>,
  actions: FailureActions,
): Partial<DecisionTagProps> {
  const { error, message } = failed;
  const requestId = error.requestId ?? undefined;
  const withId = requestId ? { requestId } : {};
  const notAllowed = (reason: string): Partial<DecisionTagProps> => ({
    state: "notAllowed",
    notAllowedReason: reason,
    onRefresh: actions.refresh,
    ...withId,
  });
  const panel = (props: {
    code: number;
    title: string;
    body: string;
    actionLabel?: string;
    onAction?: () => void;
  }): Partial<DecisionTagProps> => ({
    inlineError: <ErrorPanel compact {...props} {...withId} />,
  });
  const conflict = panel({
    code: 409,
    title: "This couldn't be recorded.",
    body: message,
    actionLabel: "Refresh list",
    onAction: actions.refresh,
  });
  const unreachable: Partial<DecisionTagProps> = {
    inlineError: <UnreachableBand requestId={error.requestId} onRetry={actions.retry} />,
  };

  switch (error.kind) {
    case "stale":
      if (error.currentVersion === null) return conflict;
      return {
        state: "stale",
        staleNote: `Version ${error.currentVersion} arrived while you were reading.`,
        staleAction: `Review version ${error.currentVersion}`,
        onReview: actions.review,
        ...withId,
      };
    case "notAllowedNow":
      return notAllowed(error.state ? NOT_ALLOWED_REASON[error.state] : NOT_ALLOWED_REASON.none);
    case "notFound":
      return notAllowed(NOT_ALLOWED_REASON.gone);
    case "badRequest":
    case "idempotencyConflict":
      return panel({
        code: 400,
        title: COPY_400.title,
        body: COPY_400.body,
        actionLabel: "Reload",
        onAction: reloadPage,
      });
    case "forbidden":
      return panel({ code: 403, title: "Not allowed", body: error.message });
    case "conflict":
      return conflict;
    case "unprocessable":
      return panel({
        code: 422,
        title: "Not allowed now",
        body: error.message,
        actionLabel: "Refresh list",
        onAction: actions.refresh,
      });
    default:
      // network, server, a rateLimited with no time to count down, an inProgress run out, and
      // signedOut (drawn by the page, never here).
      return unreachable;
  }
}

/** 5.3's `network` and `server` band: the line, the request ID, and Retry (5.2 step 4). */
function UnreachableBand({
  requestId,
  onRetry,
}: {
  requestId: string | null;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="dec-unreachable">
      <div className="dec-unreachable-line">
        <StatusGlyph status="stopped" size={12} />
        <span className="dec-unreachable-text">{UNREACHABLE}</span>
      </div>
      <div className="dec-unreachable-line">
        <Button size="sm" icon="refresh-cw" onClick={onRetry}>
          Retry
        </Button>
        {requestId ? <HashChip kind="hash" value={requestId} length={12} prefix="req" /> : null}
      </div>
    </div>
  );
}

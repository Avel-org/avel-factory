import { type ReactNode, useMemo, useState } from "react";
import { Button } from "./Button";
import { HashChip } from "./HashChip";
import { Icon, type IconName } from "./Icon";
import { canHover } from "./interaction";
import { StatusGlyph } from "./StatusGlyph";
import { Tag } from "./Tag";

// DL's DecisionTag (`n$`) and its specimen states, with UI contract section 4's changes D1 to D15.
// Not ported: `compact`, `hideActions`, `onOpen` and the "Open" link button.

/** DL's `AV_DECISION_VARIANTS`: each variant's kind label and icon. */
export const AV_DECISION_VARIANTS = {
  checkpoint: ["Checkpoint", "flag"],
  plan: ["Plan approval", "list-checks"],
  release: ["Release", "package-check"],
  pass: ["Pass approval", "badge-check"],
  budget: ["Budget increase", "wallet"],
  parked: ["Parked module", "circle-pause"],
  contract: ["Contract change", "file-diff"],
  quarantine: ["Quarantine", "shield-alert"],
  testChange: ["Test change", "flask-conical"],
  finding: ["Gate 5 finding", "search-check"],
  repin: ["Re-pin", "pin"],
  factoryPr: ["Factory PR", "git-pull-request"],
} as const satisfies Record<string, readonly [string, IconName]>;

const GENERIC: readonly [string, IconName] = ["Decision", "circle"];

/** One of DL's variant keys; any other string is drawn as the generic "Decision" (D1). */
export type DecisionVariant = keyof typeof AV_DECISION_VARIANTS | (string & {});

export type DecisionState =
  | "seen"
  | "approving"
  | "rejecting"
  | "approved"
  | "rejected"
  | "stale"
  | "notAllowed";

export type DecisionTagProps = {
  layout: "desk" | "phone";
  variant: DecisionVariant;
  idLabel?: string;
  title: string;
  clientName?: string | null;
  age?: string;
  binds?: { label: string; value: string; kind: "version" | "sha" };
  evidence?: string;
  consequence?: string;
  state: DecisionState;
  staleNote?: string;
  staleAction?: string;
  notAllowedReason?: string;
  approvedAt?: string;
  approveLabel?: string;
  rejectLabel?: string;
  link?: { label: string; href: string };
  actionsDisabledReason?: string;
  inlineError?: ReactNode;
  requestId?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onReview?: () => void;
  onRefresh?: () => void;
};

function variantLook(variant: string): readonly [string, IconName] {
  return Object.hasOwn(AV_DECISION_VARIANTS, variant)
    ? AV_DECISION_VARIANTS[variant as keyof typeof AV_DECISION_VARIANTS]
    : GENERIC;
}

/** DL's punch hole (`BH`). The fill's animation is in kit.css, held still under reduced motion (D12). */
function PunchHole({ punched }: { punched: boolean }) {
  return (
    <span aria-hidden="true" className="av-dt-hole">
      {punched ? <span data-hole-fill="" /> : null}
    </span>
  );
}

/** The request ID, as everywhere it's shown (UI contract section 4): DL's ErrorPanel chip. */
function RequestIdChip({ requestId }: { requestId: string }) {
  return (
    <div>
      <HashChip kind="hash" value={requestId} length={12} prefix="req" />
    </div>
  );
}

export function DecisionTag({
  layout,
  variant,
  idLabel,
  title,
  clientName,
  age,
  binds,
  evidence,
  consequence,
  state,
  staleNote,
  staleAction,
  notAllowedReason,
  approvedAt,
  approveLabel,
  rejectLabel,
  link,
  actionsDisabledReason,
  inlineError,
  requestId,
  onApprove,
  onReject,
  onReview,
  onRefresh,
}: DecisionTagProps) {
  const [kind, kindIcon] = variantLook(variant);
  const [hovered, setHovered] = useState(false);
  const hoverable = useMemo(canHover, []);
  const approved = state === "approved";
  const rejected = state === "rejected";
  const done = approved || rejected;
  const phone = layout === "phone";

  const stateTag = approved ? (
    <Tag tone="neutral">Approved</Tag>
  ) : rejected ? (
    <Tag tone="outline">Rejected</Tag>
  ) : state === "stale" ? (
    <Tag tone="headsup">Changed</Tag>
  ) : state === "notAllowed" ? (
    <Tag tone="outline" icon="lock">
      Locked
    </Tag>
  ) : (
    <Tag tone="needs">Needs you</Tag>
  );

  // D8: the buttons by state. D13: each is drawn only with its label.
  const decidable = !done && state !== "notAllowed";
  const deciding = state === "approving" || state === "rejecting";
  const buttonsOff = deciding || state === "stale" || actionsDisabledReason != null;
  const approveButton =
    decidable && approveLabel !== undefined ? (
      <Button
        variant="primary"
        size={phone ? "lg" : "md"}
        block={phone}
        disabled={buttonsOff}
        {...(actionsDisabledReason != null ? { disabledReason: actionsDisabledReason } : {})}
        onClick={() => onApprove?.()}
      >
        {state === "approving" ? "Approving…" : approveLabel}
      </Button>
    ) : null;
  const rejectButton =
    decidable && rejectLabel !== undefined ? (
      <Button
        variant="ghost"
        size={phone ? "lg" : "md"}
        block={phone}
        disabled={buttonsOff}
        onClick={() => onReject?.()}
      >
        {state === "rejecting" ? "Rejecting…" : `${rejectLabel}…`}
      </Button>
    ) : null;
  // D9: the link replaces DL's "Open" button, in the link Button's look.
  const linkButton = link ? (
    <a
      data-ui="Button"
      data-variant="link"
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.label}
      <Icon name="arrow-up-right" size={16} />
    </a>
  ) : null;
  const refreshButton =
    state === "notAllowed" && onRefresh ? (
      <Button size="sm" onClick={onRefresh}>
        Refresh list
      </Button>
    ) : null;

  let actions: ReactNode = null;
  if (approveButton || rejectButton || linkButton || refreshButton) {
    actions = phone ? (
      <div className="av-dt-actions-phone">
        {approveButton && rejectButton ? (
          // D11: DL's Decisions card on a phone (.pd[data-phone] .pd-actions): Reject left, Approve
          // right. The grid is kit.css's .av-dt-pair rule.
          <div className="av-dt-pair">
            {rejectButton}
            {approveButton}
          </div>
        ) : (
          (approveButton ?? rejectButton)
        )}
        {refreshButton}
        {linkButton}
      </div>
    ) : (
      <div className="av-dt-row">
        {approveButton && rejectButton ? (
          // D11: the same container in DL's desk order. kit.css lays it out as the row (display:
          // contents) at 900px and over, and as D11's grid, Reject left, under 900px, so the
          // server's desk HTML is D11 on a phone before hydration.
          <div className="av-dt-pair">
            {approveButton}
            {rejectButton}
          </div>
        ) : (
          (approveButton ?? rejectButton)
        )}
        {refreshButton}
        {linkButton ? (
          <>
            <span className="av-dt-spacer" />
            {linkButton}
          </>
        ) : null}
      </div>
    );
  }

  // D14: at most one request ID chip per card. stale and notAllowed draw theirs under the note
  // or the reason; the countdown's is drawn only in seen, the state 5.3 gives a 429.
  const countdownChip = !!requestId && actionsDisabledReason != null && state === "seen";

  const footer = approved ? (
    <span className="av-dt-muted">
      {`Approved by you${approvedAt ? ` at ${approvedAt}` : ""}. Logged with ${binds ? binds.label : "this version"}.`}
    </span>
  ) : rejected ? (
    <span className="av-dt-muted">Rejected. Reason sent to the agents and logged.</span>
  ) : actions || countdownChip ? (
    <div className="av-dt-footer">
      {actions}
      {/* D14: the request ID under the countdown. */}
      {countdownChip ? <RequestIdChip requestId={requestId as string} /> : null}
    </div>
  ) : null;

  return (
    <article
      data-ui="DecisionTag"
      data-variant={variant}
      data-state={state}
      data-layout={layout}
      data-hovered={hovered ? "" : undefined}
      aria-label={idLabel ? `${kind} ${idLabel}: ${title}` : `${kind}: ${title}`}
      onPointerEnter={() => {
        if (hoverable) setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="av-dt-body">
        <div className="av-dt-head">
          <PunchHole punched={approved} />
          <span className="av-dt-kind">
            <Icon name={kindIcon} size={14} />
            <span className="av-dt-kind-label">{kind}</span>
          </span>
          {/* D3: the client after the kind label, as DL's Decisions card draws the project. */}
          {clientName ? <span className="av-dt-client">{clientName}</span> : null}
          {/* D2: no id, no chip. */}
          {idLabel ? <HashChip kind="id" value={idLabel} /> : null}
          <span className="av-dt-spacer" />
          {age ? <span className="av-dt-age">{age}</span> : null}
          {stateTag}
        </div>

        <h3 className="av-dt-title">{title}</h3>

        {state === "stale" ? (
          <>
            <div role="alert" className="av-dt-stale">
              <StatusGlyph status="headsup" size={14} />
              <span className="av-dt-stale-note">
                {staleNote || "This changed since you opened it."}
              </span>
              <Button size="sm" onClick={() => onReview?.()}>
                {staleAction || "Review new version"}
              </Button>
            </div>
            {/* D14: the request ID under the stale note. */}
            {requestId ? <RequestIdChip requestId={requestId} /> : null}
          </>
        ) : null}

        {binds ? (
          binds.kind === "version" ? (
            // D6: a version binding is text, struck through when stale. The strike stays inline:
            // the locked UC-08 reads it from the element.
            <span
              className="av-dt-muted"
              style={state === "stale" ? { textDecoration: "line-through" } : undefined}
            >
              {`Binds to ${binds.label}`}
            </span>
          ) : (
            <div className="av-dt-row">
              <span className="av-dt-muted">Binds to</span>
              <HashChip
                kind="sha"
                value={binds.value}
                prefix={binds.label}
                strike={state === "stale"}
              />
            </div>
          )
        ) : null}

        {/* D15: the facts list, with its top rule, only when there's a fact to list. */}
        {evidence || consequence ? (
          <dl className="av-dt-facts">
            {evidence ? (
              <>
                <dt className="av-dt-muted av-dt-evidence">Evidence</dt>
                <dd>{evidence}</dd>
              </>
            ) : null}
            {consequence ? (
              <>
                <dt className="av-dt-muted av-dt-consequence">Consequence</dt>
                <dd>{consequence}</dd>
              </>
            ) : null}
          </dl>
        ) : null}

        {state === "notAllowed" ? (
          <>
            <div className="av-dt-locked">
              <span className="av-dt-locked-icon">
                <Icon name="lock" size={14} />
              </span>
              <span className="av-dt-locked-text">
                {notAllowedReason || "You cannot approve this yet."}
              </span>
            </div>
            {/* D14: the request ID under the Locked reason. */}
            {requestId ? <RequestIdChip requestId={requestId} /> : null}
          </>
        ) : null}

        {/* D10: the inline error sits above the actions. */}
        {inlineError ?? null}

        {footer ? <div className="av-dt-foot">{footer}</div> : null}
      </div>

      {approved ? (
        // D12: the stamp lands over --av-d-punch, which DL's reduced-motion block sets to 0. The
        // animation stays inline: the locked UC-08 reads --av-d-punch from the card's HTML.
        <span
          aria-hidden="true"
          className="av-dt-stamp"
          style={{ animation: "av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both" }}
        >
          Approved
        </span>
      ) : null}
    </article>
  );
}

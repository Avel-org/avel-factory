import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { Button, LINK_BUTTON_STYLE } from "./Button";
import { HashChip } from "./HashChip";
import { Icon, type IconName } from "./Icon";
import { canHover } from "./interaction";
import { KitStyles } from "./KitStyles";
import { StatusGlyph } from "./StatusGlyph";
import { Tag } from "./Tag";

// DL's DecisionTag (`n$`) and its specimen states, with UI contract section 4's changes D1 to D14.
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

/** DL's punch hole (`BH`). The fill's animation is in KitStyles, held still under reduced motion (D12). */
function PunchHole({ punched }: { punched: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        width: 14,
        height: 14,
        flex: "none",
        borderRadius: "50%",
        background: "var(--av-floor)",
        boxShadow: "inset 0 0 0 1px var(--av-hairline-strong), var(--av-shadow-pressed)",
      }}
    >
      {punched ? (
        <span
          data-hole-fill=""
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "var(--av-ink)",
          }}
        />
      ) : null}
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

const LABEL_MUTED: CSSProperties = { color: "var(--av-muted)", fontSize: "var(--av-fs-label)" };

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
  const inset = phone ? 18 : 16;

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
      style={LINK_BUTTON_STYLE}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {approveButton && rejectButton ? (
          // D11: DL's Decisions card on a phone (.pd[data-phone] .pd-actions): Reject left, Approve right.
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
              gap: "10px",
            }}
          >
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {approveButton}
        {rejectButton}
        {refreshButton}
        {linkButton ? (
          <>
            <span style={{ flex: "1 1 auto" }} />
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
    <span style={LABEL_MUTED}>
      {`Approved by you${approvedAt ? ` at ${approvedAt}` : ""}. Logged with ${binds ? binds.label : "this version"}.`}
    </span>
  ) : rejected ? (
    <span style={LABEL_MUTED}>Rejected. Reason sent to the agents and logged.</span>
  ) : actions || countdownChip ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      aria-label={idLabel ? `${kind} ${idLabel}: ${title}` : `${kind}: ${title}`}
      onPointerEnter={() => {
        if (hoverable) setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: "relative",
        boxSizing: "border-box",
        background: "var(--av-faceplate)",
        backdropFilter: "var(--av-glass-blur)",
        WebkitBackdropFilter: "var(--av-glass-blur)",
        borderRadius: "var(--av-radius-tag)",
        boxShadow: "var(--av-shadow-faceplate)",
        transform: hovered && !done ? "translateY(-1px)" : "none",
        transition: "transform var(--av-d-lift) var(--av-ease)",
      }}
    >
      <KitStyles />
      <div
        style={{
          padding: `14px ${inset}px ${inset}px ${inset}px`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: phone ? 8 : 10,
            rowGap: 6,
            minWidth: 0,
            flexWrap: phone ? "wrap" : "nowrap",
          }}
        >
          <PunchHole punched={approved} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--av-muted)",
              fontSize: "var(--av-fs-label)",
              fontWeight: 500,
              minWidth: 0,
            }}
          >
            <Icon name={kindIcon} size={14} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {kind}
            </span>
          </span>
          {/* D3: the client after the kind label, as DL's Decisions card draws the project. */}
          {clientName ? (
            <span
              style={{
                color: "var(--av-muted)",
                fontSize: "var(--av-fs-label)",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {clientName}
            </span>
          ) : null}
          {/* D2: no id, no chip. */}
          {idLabel ? <HashChip kind="id" value={idLabel} /> : null}
          <span style={{ flex: "1 1 auto" }} />
          {age ? (
            <span
              style={{
                color: "var(--av-muted)",
                fontSize: "var(--av-fs-small)",
                whiteSpace: "nowrap",
              }}
            >
              {age}
            </span>
          ) : null}
          {stateTag}
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: "var(--av-fs-title)",
            lineHeight: "var(--av-lh-title)",
            fontWeight: 600,
            textWrap: "pretty",
            paddingRight: approved ? 96 : 0,
          }}
        >
          {title}
        </h3>

        {state === "stale" ? (
          <>
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                padding: "8px 10px",
                borderRadius: "var(--av-radius-control)",
                background: "var(--av-inset)",
              }}
            >
              <StatusGlyph status="headsup" size={14} />
              <span style={{ flex: "1 1 180px", fontWeight: 500 }}>
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
            // D6: a version binding is text, struck through when stale.
            <span
              style={{
                ...LABEL_MUTED,
                textDecoration: state === "stale" ? "line-through" : undefined,
              }}
            >
              {`Binds to ${binds.label}`}
            </span>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={LABEL_MUTED}>Binds to</span>
              <HashChip
                kind="sha"
                value={binds.value}
                prefix={binds.label}
                strike={state === "stale"}
              />
            </div>
          )
        ) : null}

        <dl
          style={{
            margin: 0,
            display: "grid",
            gridTemplateColumns: phone ? "1fr" : "minmax(84px, max-content) minmax(0, 1fr)",
            columnGap: 14,
            rowGap: phone ? 2 : 6,
            paddingTop: 10,
            borderTop: "1px solid var(--av-hairline)",
            fontSize: "var(--av-fs-body)",
          }}
        >
          {evidence ? (
            <>
              <dt style={{ ...LABEL_MUTED, marginTop: phone ? 4 : 0 }}>Evidence</dt>
              <dd style={{ margin: 0, textWrap: "pretty" }}>{evidence}</dd>
            </>
          ) : null}
          {consequence ? (
            <>
              <dt style={{ ...LABEL_MUTED, marginTop: phone ? 8 : 0 }}>Consequence</dt>
              <dd style={{ margin: 0, textWrap: "pretty" }}>{consequence}</dd>
            </>
          ) : null}
        </dl>

        {state === "notAllowed" ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                color: "var(--av-muted)",
              }}
            >
              <span style={{ display: "inline-flex", marginTop: 3 }}>
                <Icon name="lock" size={14} />
              </span>
              <span style={{ textWrap: "pretty" }}>
                {notAllowedReason || "You cannot approve this yet."}
              </span>
            </div>
            {/* D14: the request ID under the Locked reason. */}
            {requestId ? <RequestIdChip requestId={requestId} /> : null}
          </>
        ) : null}

        {/* D10: the inline error sits above the actions. */}
        {inlineError ?? null}

        {footer ? (
          <div style={{ borderTop: "1px solid var(--av-hairline)", paddingTop: 12 }}>{footer}</div>
        ) : null}
      </div>

      {approved ? (
        // D12: the stamp lands over --av-d-punch, which DL's reduced-motion block sets to 0.
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 18,
            top: 44,
            padding: "3px 10px",
            border: "2px solid var(--av-ink)",
            borderRadius: "var(--av-radius-stamp)",
            color: "var(--av-ink)",
            background: "var(--av-faceplate)",
            fontWeight: 600,
            fontSize: "var(--av-fs-title)",
            lineHeight: "var(--av-lh-title)",
            animation: "av-stamp-land var(--av-d-punch) var(--av-ease) 80ms both",
            transform: "rotate(-7deg)",
          }}
        >
          Approved
        </span>
      ) : null}
    </article>
  );
}

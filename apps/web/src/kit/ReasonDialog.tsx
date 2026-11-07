import { type FormEvent, type KeyboardEvent, useId, useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { HashChip } from "./HashChip";
import { StatusGlyph } from "./StatusGlyph";

// DL's ReasonDialog (`Go`), with UI contract section 4's changes:
// - R1. `error` shows under the textarea with role="alert", in DL's own field-error form (its
//   step-up password dialog: a stopped glyph and the text in --av-stopped, the field edged in it).
// - R2. On open the text is `defaultReason ?? ""` (DL clears it to "").
// - R3. `onConfirm` doesn't close the dialog: the caller does.
// - R4. `requestId` draws the request ID chip under `error`.

export interface ReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  placeholder?: string;
  minLength?: number;
  error?: string;
  defaultReason?: string;
  requestId?: string;
}

export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  placeholder = "A few words for the record",
  minLength = 3,
  error,
  defaultReason,
  requestId,
}: ReasonDialogProps) {
  const [text, setText] = useState(defaultReason ?? "");
  // R2: every time the dialog opens, the text starts again from defaultReason.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setText(defaultReason ?? "");
  }
  const fieldId = useId();
  const errorId = useId();
  const reason = text.trim();
  const valid = reason.length >= minLength;

  // R3: confirming only reports the reason.
  const confirm = (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    if (valid) onConfirm(reason);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      {...(description ? { description } : {})}
      size="sm"
      dataUi="ReasonDialog"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            disabled={!valid}
            onClick={() => confirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={confirm} className="av-reason-form">
        <label htmlFor={fieldId} className="av-reason-label">
          Why?
        </label>
        <textarea
          id={fieldId}
          data-autofocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) confirm(event);
          }}
        />
        {error ? (
          <span id={errorId} role="alert" className="av-reason-error">
            <StatusGlyph status="stopped" size={10} />
            {error}
          </span>
        ) : null}
        {requestId ? (
          <div>
            <HashChip kind="hash" value={requestId} length={12} prefix="req" />
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}

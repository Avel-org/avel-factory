import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

// DL's HashChip (`dt`). `verified`, `href` and `title` aren't ported (UI contract section 4), so
// the chip's title is always the full value. DL's copy button is kept: `aria-label` "Copy {value}".

export interface HashChipProps {
  value: string | number | null | undefined;
  kind?: "sha" | "hash" | "id";
  length?: number;
  prefix?: string;
  strike?: boolean;
  /** Defaults to true for every kind but "id", as DL's does. */
  copy?: boolean;
}

const COPIED_MS = 1200;

export function HashChip({ value, kind = "sha", length = 7, prefix, strike, copy }: HashChipProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const withCopy = copy ?? kind !== "id";
  const copyAttr = withCopy ? "" : undefined;
  if (value == null) {
    return (
      <span data-ui="HashChip" data-copy={copyAttr}>
        {"—"}
      </span>
    );
  }
  const full = String(value);
  const shown = kind === "id" ? full : full.slice(0, length);
  const onCopy = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // As DL's: the copy is best effort, and the button confirms the tap either way. A browser
    // without the Clipboard API (or one that refuses it) leaves the full value in the title.
    navigator.clipboard?.writeText(full).catch(() => undefined);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <span data-ui="HashChip" data-kind={kind} data-copy={copyAttr} title={full}>
      {prefix ? <span className="av-hash-prefix">{prefix}</span> : null}
      <span data-strike={strike ? "" : undefined}>{shown}</span>
      {withCopy ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${full}`}
          title={copied ? "Copied" : "Copy"}
          className="av-hash-copy"
          data-copied={copied ? "" : undefined}
        >
          {copied ? "Copied" : <Icon name="copy" size={12} />}
        </button>
      ) : null}
    </span>
  );
}

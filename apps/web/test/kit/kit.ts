import type { ComponentType, ReactNode } from "react";
import { expect } from "vitest";

// The kit under test (UI contract section 4). Fantem builds apps/web/src/kit/index.ts after these
// tests are locked, and the locked vitest.config.ts has no stub for it. So until it exists, each
// component here is an inert stand-in that draws nothing: a test then fails on its assertion, not
// on an import. The moment index.ts exists, the real components are used and the stand-ins are not.

export type DecisionState =
  | "seen"
  | "approving"
  | "rejecting"
  | "approved"
  | "rejected"
  | "stale"
  | "notAllowed";

export interface DecisionTagProps {
  layout: "desk" | "phone";
  variant: string;
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
}

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

export interface ErrorPanelProps {
  code?: number;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  requestId?: string;
  compact?: boolean;
}

export interface WidgetStateProps {
  state?: "loading" | "empty" | "error" | "staleVersion";
  title?: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  lastGoodAge?: number;
  requestId?: string;
  children?: ReactNode;
}

const modules = import.meta.glob<Record<string, unknown>>("../../src/kit/index.ts", {
  eager: true,
});
const built: Record<string, unknown> = Object.values(modules)[0] ?? {};

function pick<P>(name: string): ComponentType<P> {
  const component = built[name];
  const isComponent =
    typeof component === "function" || (typeof component === "object" && component !== null);
  return isComponent ? (component as ComponentType<P>) : () => null;
}

export const DecisionTag = pick<DecisionTagProps>("DecisionTag");
export const ReasonDialog = pick<ReasonDialogProps>("ReasonDialog");
export const ErrorPanel = pick<ErrorPanelProps>("ErrorPanel");
export const WidgetState = pick<WidgetStateProps>("WidgetState");

/** A query that must find something: fails on an assertion, with a message, when it doesn't. */
export function found<T>(value: T | null | undefined, what: string): T {
  expect(value, `expected ${what} to be drawn`).not.toBeNull();
  expect(value, `expected ${what} to be drawn`).not.toBeUndefined();
  return value as T;
}

/** Whether an element, or one of its ancestors up to `within`, is struck through. */
export function isStruck(el: Element, within: Element): boolean {
  for (
    let node: Element | null = el;
    node && node !== within.parentElement;
    node = node.parentElement
  ) {
    const style = (node as HTMLElement).style;
    if (style?.textDecoration.includes("line-through")) return true;
    if (node.className?.toString().includes("line-through")) return true;
    if (node.tagName === "S" || node.tagName === "DEL") return true;
  }
  return false;
}

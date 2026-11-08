import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import {
  found,
  hasLoadReasonDialog,
  loadReasonDialog,
  ReasonDialog,
  type ReasonDialogProps,
} from "./kit";

// UC-09: ReasonDialog (UI contract section 4, R1 to R4; DL's Go).

const REQUEST_ID = "0193a7c0-4b1e-7000-8000-00000000abcd";

function props(extra: Partial<ReasonDialogProps> = {}): ReasonDialogProps {
  return {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Approve this decision?",
    description: "Raise landing budget to $180. Your reason goes on the record.",
    confirmLabel: "Approve",
    ...extra,
  };
}

function open(extra: Partial<ReasonDialogProps> = {}) {
  const p = props(extra);
  const result = render(<ReasonDialog {...p} />);
  return { ...result, p };
}

function dialog(): HTMLElement {
  return found(screen.queryByRole("dialog"), "the reason dialog");
}

function reasonBox(): HTMLTextAreaElement {
  return found(
    screen.queryByLabelText("Why?") as HTMLTextAreaElement | null,
    "the 'Why?' textarea",
  );
}

function confirm(): HTMLButtonElement {
  return found(
    screen.queryByRole("button", { name: "Approve" }) as HTMLButtonElement | null,
    "the confirm button",
  );
}

describe("UC-09 ReasonDialog", () => {
  test("UC-09 open: a modal dialog named by its title, with the description, the Why? field and Cancel", () => {
    open();
    const d = dialog();
    expect(d.getAttribute("data-ui")).toBe("ReasonDialog");
    expect(d.getAttribute("aria-modal")).toBe("true");
    expect(screen.queryByRole("dialog", { name: "Approve this decision?" })).not.toBeNull();
    expect(d.textContent).toContain(
      "Raise landing budget to $180. Your reason goes on the record.",
    );
    expect(reasonBox().value).toBe("");
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeNull();
  });

  test("UC-09 closed: nothing is drawn", () => {
    const view = render(<ReasonDialog {...props({ open: false })} />);
    expect(view.baseElement.querySelector('[data-ui="ReasonDialog"]')).toBeNull();
    view.rerender(<ReasonDialog {...props({ open: true })} />);
    expect(view.baseElement.querySelector('[data-ui="ReasonDialog"]')).not.toBeNull();
  });

  test("UC-09 confirm is disabled under 3 trimmed characters, and enabled from 3", async () => {
    const user = userEvent.setup();
    open();
    expect(confirm().disabled).toBe(true);
    await user.type(reasonBox(), "ab");
    expect(confirm().disabled).toBe(true);
    await user.type(reasonBox(), "  ");
    expect(confirm().disabled).toBe(true);
    await user.type(reasonBox(), "c");
    expect(confirm().disabled).toBe(false);
  });

  test("UC-09 padding doesn't count: '  ab  ' keeps confirm disabled", async () => {
    const user = userEvent.setup();
    open();
    await user.type(reasonBox(), "  ab  ");
    expect(confirm().disabled).toBe(true);
  });

  test("UC-09 confirming calls onConfirm once with the trimmed reason", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.type(reasonBox(), "  Within the cap we agreed  ");
    await user.click(confirm());
    expect(p.onConfirm).toHaveBeenCalledTimes(1);
    expect(p.onConfirm).toHaveBeenCalledWith("Within the cap we agreed");
  });

  test("UC-09 Ctrl+Enter confirms", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.type(reasonBox(), "Within the cap");
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(p.onConfirm).toHaveBeenCalledTimes(1);
    expect(p.onConfirm).toHaveBeenCalledWith("Within the cap");
  });

  test("UC-09 Cmd+Enter confirms", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.type(reasonBox(), "Within the cap");
    await user.keyboard("{Meta>}{Enter}{/Meta}");
    expect(p.onConfirm).toHaveBeenCalledTimes(1);
    expect(p.onConfirm).toHaveBeenCalledWith("Within the cap");
  });

  test("UC-09 Ctrl+Enter under 3 characters doesn't confirm", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.type(reasonBox(), "ab");
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(p.onConfirm).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  test("UC-09 (R3) onConfirm doesn't close the dialog: onClose isn't called and the dialog stays", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.type(reasonBox(), "Within the cap");
    await user.click(confirm());
    expect(p.onConfirm).toHaveBeenCalledTimes(1);
    expect(p.onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  test("UC-09 Cancel calls onClose and not onConfirm", async () => {
    const user = userEvent.setup();
    const { p } = open();
    await user.click(found(screen.queryByRole("button", { name: "Cancel" }), "Cancel"));
    expect(p.onClose).toHaveBeenCalledTimes(1);
    expect(p.onConfirm).not.toHaveBeenCalled();
  });

  test("UC-09 (R1) error shows under the textarea with role alert, and the dialog stays open", () => {
    open({ error: "The server didn't accept this reason. Write a few more words." });
    const alert = found(screen.queryByRole("alert"), "the error (role alert)");
    expect(alert.textContent).toContain(
      "The server didn't accept this reason. Write a few more words.",
    );
    expect(dialog()).not.toBeNull();
    expect(
      reasonBox().compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("UC-09 no error, no alert", () => {
    open();
    expect(dialog()).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("UC-09 (R2) defaultReason fills the text on open, and confirm is enabled for it", () => {
    open({ defaultReason: "Within the cap we agreed" });
    expect(reasonBox().value).toBe("Within the cap we agreed");
    expect(confirm().disabled).toBe(false);
  });

  test("UC-09 (R2) reopening sets the text to defaultReason again, replacing what was typed", async () => {
    const user = userEvent.setup();
    const p = props({ defaultReason: "First reason" });
    const view = render(<ReasonDialog {...p} />);
    await user.clear(reasonBox());
    await user.type(reasonBox(), "Something else entirely");
    view.rerender(<ReasonDialog {...p} open={false} />);
    view.rerender(<ReasonDialog {...p} open={true} />);
    expect(reasonBox().value).toBe("First reason");
  });

  test("UC-09 no defaultReason: the text is empty on open", () => {
    open();
    expect(reasonBox().value).toBe("");
  });

  test("UC-09 (R4) requestId draws the chip 'Copy {id}', under the error", () => {
    open({ error: "The server didn't accept this reason.", requestId: REQUEST_ID });
    const chip = found(
      screen.queryByRole("button", { name: `Copy ${REQUEST_ID}` }),
      "the request ID chip",
    );
    const alert = found(screen.queryByRole("alert"), "the error");
    expect(alert.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("UC-09 (R4) no requestId, no request ID chip", () => {
    open({ error: "The server didn't accept this reason." });
    expect(dialog()).not.toBeNull();
    expect(screen.queryByRole("button", { name: /^Copy / })).toBeNull();
  });

  test("UC-09 (R7) loadReasonDialog resolves to a module whose ReasonDialog is the kit index's ReasonDialog", async () => {
    expect(hasLoadReasonDialog, "the kit index exports loadReasonDialog").toBe(true);
    const loaded = await loadReasonDialog();
    expect(loaded.ReasonDialog).toBe(ReasonDialog);
  });
});

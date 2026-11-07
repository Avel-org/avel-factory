import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { DecisionTag, type DecisionTagProps, found, isStruck } from "./kit";

// UC-08: DecisionTag (UI contract section 4, D1 to D14), one test per state with D8's buttons.

const REQUEST_ID = "0193a7c0-4b1e-7000-8000-00000000abcd";

const seen: DecisionTagProps = {
  layout: "desk",
  variant: "budget",
  title: "Raise landing budget to $180",
  clientName: "Harbour Dental",
  age: "Waiting 6m",
  binds: { kind: "version", label: "Version 4", value: "4" },
  evidence: "Spend is at 92% of the cap with two modules left.",
  consequence: "The mission carries on to its next gate.",
  state: "seen",
  approveLabel: "Approve",
  rejectLabel: "Reject",
};

function draw(props: Partial<DecisionTagProps> = {}) {
  const result = render(<DecisionTag {...seen} {...props} />);
  const card = found(
    result.container.querySelector<HTMLElement>('[data-ui="DecisionTag"]'),
    'a [data-ui="DecisionTag"] card',
  );
  return { ...result, card };
}

function button(card: HTMLElement, name: string | RegExp): HTMLButtonElement {
  return found(
    within(card).queryByRole("button", { name }) as HTMLButtonElement | null,
    `a button named ${String(name)}`,
  );
}

describe("UC-08 DecisionTag, one test per state", () => {
  test("UC-08 seen: the card, its Needs you tag and the kind, client and age; both buttons enabled and calling back", async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const { card } = draw({ onApprove, onReject });
    expect(card.getAttribute("data-state")).toBe("seen");
    expect(card.getAttribute("data-variant")).toBe("budget");
    expect(within(card).queryByText("Needs you")).not.toBeNull();
    expect(within(card).queryByText("Budget increase")).not.toBeNull();
    expect(within(card).queryByText("Harbour Dental")).not.toBeNull();
    expect(within(card).queryByText("Waiting 6m")).not.toBeNull();
    expect(within(card).queryByRole("heading", { name: seen.title })).not.toBeNull();
    expect(within(card).queryByText(seen.evidence as string)).not.toBeNull();
    expect(within(card).queryByText(seen.consequence as string)).not.toBeNull();
    const approve = button(card, "Approve");
    const reject = button(card, "Reject…");
    expect(approve.disabled).toBe(false);
    expect(reject.disabled).toBe(false);
    await userEvent.click(approve);
    await userEvent.click(reject);
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  test("UC-08 approving: the Approve button reads Approving…, and both buttons are disabled", () => {
    const { card } = draw({ state: "approving" });
    expect(card.getAttribute("data-state")).toBe("approving");
    expect(within(card).queryByText("Needs you")).not.toBeNull();
    expect(button(card, "Approving…").disabled).toBe(true);
    expect(button(card, "Reject…").disabled).toBe(true);
  });

  test("UC-08 rejecting (D7): the Reject button reads Rejecting…, and both buttons are disabled", () => {
    const { card } = draw({ state: "rejecting" });
    expect(card.getAttribute("data-state")).toBe("rejecting");
    expect(within(card).queryByText("Needs you")).not.toBeNull();
    expect(button(card, "Rejecting…").disabled).toBe(true);
    expect(button(card, "Approve").disabled).toBe(true);
  });

  test("UC-08 approved (D5): the stamp, the Approved tag and the line 'Approved by you at 14:06. Logged with Version 4.', and no buttons", () => {
    const { card } = draw({ state: "approved", approvedAt: "14:06" });
    expect(card.getAttribute("data-state")).toBe("approved");
    expect(card.textContent).toContain("Approved by you at 14:06. Logged with Version 4.");
    const stamp = found(
      Array.from(card.querySelectorAll('[aria-hidden="true"]')).find(
        (el) => el.textContent === "Approved",
      ),
      "the Approved stamp",
    );
    expect(stamp.textContent).toBe("Approved");
    expect(within(card).queryAllByText("Approved").length).toBeGreaterThanOrEqual(2);
    expect(within(card).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-08 approved (D12): the stamp's animation reads --av-d-punch", () => {
    const { card } = draw({ state: "approved", approvedAt: "14:06" });
    expect(card.outerHTML).toContain("--av-d-punch");
  });

  test("UC-08 rejected: DL's line 'Rejected. Reason sent to the agents and logged.', the Rejected tag, no buttons", () => {
    const { card } = draw({ state: "rejected" });
    expect(card.getAttribute("data-state")).toBe("rejected");
    expect(card.textContent).toContain("Rejected. Reason sent to the agents and logged.");
    expect(within(card).queryByText("Rejected")).not.toBeNull();
    expect(within(card).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-08 stale (D6, D8): the Changed tag, the binding struck, the note and the action; both buttons disabled", async () => {
    const onReview = vi.fn();
    const { card } = draw({
      state: "stale",
      staleNote: "Version 5 arrived while you were reading.",
      staleAction: "Review version 5",
      onReview,
    });
    expect(card.getAttribute("data-state")).toBe("stale");
    expect(within(card).queryByText("Changed")).not.toBeNull();
    const binding = found(within(card).queryByText(/Binds to Version 4/), "'Binds to Version 4'");
    expect(isStruck(binding, card)).toBe(true);
    const alert = found(within(card).queryByRole("alert"), "the stale note (role alert)");
    expect(alert.textContent).toContain("Version 5 arrived while you were reading.");
    expect(button(card, "Approve").disabled).toBe(true);
    expect(button(card, "Reject…").disabled).toBe(true);
    await userEvent.click(button(card, "Review version 5"));
    expect(onReview).toHaveBeenCalledTimes(1);
  });

  test("UC-08 notAllowed (D8): the Locked tag and the reason, and no buttons even with labels", () => {
    const { card } = draw({
      state: "notAllowed",
      notAllowedReason: "This decision was already made.",
    });
    expect(card.getAttribute("data-state")).toBe("notAllowed");
    expect(within(card).queryByText("Locked")).not.toBeNull();
    expect(card.textContent).toContain("This decision was already made.");
    expect(within(card).queryByRole("button", { name: "Approve" })).toBeNull();
    expect(within(card).queryByRole("button", { name: /^Reject/ })).toBeNull();
    expect(within(card).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-08 notAllowed with onRefresh (D10): 'Refresh list' is the only button, and calls back", async () => {
    const onRefresh = vi.fn();
    const { card } = draw({
      state: "notAllowed",
      notAllowedReason: "This decision no longer exists.",
      onRefresh,
    });
    expect(within(card).queryAllByRole("button")).toHaveLength(1);
    await userEvent.click(button(card, "Refresh list"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("UC-08 DecisionTag labels, link, id, disabled reason, request ID and layout", () => {
  test("UC-08 the buttons read approveLabel and {rejectLabel}… (D13)", () => {
    const { card } = draw({ approveLabel: "Accept change", rejectLabel: "Decline" });
    expect(button(card, "Accept change").disabled).toBe(false);
    expect(button(card, "Decline…").disabled).toBe(false);
  });

  test("UC-08 a rejectLabel of Reject reads DL's Reject… (D13)", () => {
    const { card } = draw({ rejectLabel: "Reject" });
    expect(button(card, "Reject…")).not.toBeNull();
  });

  test("UC-08 no labels, no buttons (D8)", () => {
    const { card } = draw({ approveLabel: undefined, rejectLabel: undefined });
    expect(within(card).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-08 only an approveLabel: Approve is drawn and Reject is not (D13)", () => {
    const { card } = draw({ rejectLabel: undefined });
    expect(button(card, "Approve")).not.toBeNull();
    expect(within(card).queryByRole("button", { name: /^Reject/ })).toBeNull();
  });

  test("UC-08 link (D9): drawn as a link opening href in a new tab, with noopener noreferrer, and no Open button", () => {
    const { card } = draw({
      variant: "factoryPr",
      approveLabel: undefined,
      rejectLabel: undefined,
      link: { label: "Open on GitHub", href: "https://github.com/avel/factory/pull/412" },
    });
    const link = found(
      within(card).queryByRole("link", { name: /Open on GitHub/ }),
      "the 'Open on GitHub' link",
    );
    expect(link.getAttribute("href")).toBe("https://github.com/avel/factory/pull/412");
    expect(link.getAttribute("target")).toBe("_blank");
    const rel = (link.getAttribute("rel") ?? "").split(/\s+/);
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
    expect(within(card).queryByRole("button", { name: "Open" })).toBeNull();
  });

  test("UC-08 no link given: no link is drawn and DL's Open button is gone (D9)", () => {
    const { card } = draw();
    expect(within(card).queryByRole("link")).toBeNull();
    expect(within(card).queryByRole("button", { name: "Open" })).toBeNull();
  });

  test("UC-08 idLabel (D2): the id chip is drawn and the aria-label is '{kind} {id}: {title}'", () => {
    const { card } = draw({ variant: "factoryPr", idLabel: "#412" });
    const chip = found(card.querySelector('[data-ui="HashChip"][data-kind="id"]'), "the id chip");
    expect(chip.textContent).toContain("#412");
    expect(card.getAttribute("aria-label")).toBe(`Factory PR #412: ${seen.title}`);
  });

  test("UC-08 no idLabel (D2): no id chip, and the aria-label is '{kind}: {title}'", () => {
    const { card } = draw();
    expect(card.querySelector('[data-ui="HashChip"][data-kind="id"]')).toBeNull();
    expect(card.getAttribute("aria-label")).toBe(`Budget increase: ${seen.title}`);
  });

  test("UC-08 an unknown variant is the generic Decision (D1)", () => {
    const { card } = draw({ variant: "somethingNew" });
    expect(card.getAttribute("aria-label")).toBe(`Decision: ${seen.title}`);
    expect(within(card).queryByText("Decision")).not.toBeNull();
  });

  test("UC-08 no clientName draws no client (D3)", () => {
    const { card } = draw({ clientName: null });
    expect(within(card).queryByText("Harbour Dental")).toBeNull();
    expect(card.getAttribute("aria-label")).toBe(`Budget increase: ${seen.title}`);
  });

  test("UC-08 a sha binding (D6) is DL's HashChip, its prefix the label", () => {
    const sha = "9fceb02d0ae598e95dc970b74767f19372d61af8";
    const { card } = draw({ binds: { kind: "sha", label: "Commit", value: sha } });
    const chip = found(
      card.querySelector('[data-ui="HashChip"][data-kind="sha"]'),
      "the commit chip",
    );
    expect(chip.textContent).toContain("Commit");
    expect(chip.textContent).toContain(sha.slice(0, 7));
    expect(within(card).queryByText(/Binds to Version/)).toBeNull();
  });

  test("UC-08 a version binding (D6) reads 'Binds to Version 4' as text", () => {
    const { card } = draw();
    expect(card.textContent).toContain("Binds to Version 4");
    expect(card.querySelector('[data-ui="HashChip"][data-kind="sha"]')).toBeNull();
  });

  test("UC-08 actionsDisabledReason (D10): shown, both buttons disabled, and Approve points at it with aria-describedby", () => {
    const { card } = draw({ actionsDisabledReason: "Retry in 3s" });
    expect(within(card).queryByText("Retry in 3s")).not.toBeNull();
    const approve = button(card, "Approve");
    expect(approve.disabled).toBe(true);
    expect(button(card, "Reject…").disabled).toBe(true);
    const described = found(approve.getAttribute("aria-describedby"), "Approve's aria-describedby");
    expect(document.getElementById(described)?.textContent).toBe("Retry in 3s");
  });

  test("UC-08 inlineError (D10) is drawn above the actions", () => {
    const { card } = draw({ inlineError: <p>Couldn't reach the server.</p> });
    const message = found(
      within(card).queryByText("Couldn't reach the server."),
      "the inline error",
    );
    const approve = button(card, "Approve");
    expect(
      message.compareDocumentPosition(approve) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("UC-08 requestId in stale (D14): the chip reads 'Copy {id}'", () => {
    const { card } = draw({
      state: "stale",
      staleNote: "Version 5 arrived while you were reading.",
      staleAction: "Review version 5",
      requestId: REQUEST_ID,
    });
    expect(button(card, `Copy ${REQUEST_ID}`)).not.toBeNull();
  });

  test("UC-08 requestId in notAllowed (D14): the chip reads 'Copy {id}'", () => {
    const { card } = draw({
      state: "notAllowed",
      notAllowedReason: "This decision expired.",
      requestId: REQUEST_ID,
    });
    expect(button(card, `Copy ${REQUEST_ID}`)).not.toBeNull();
  });

  test("UC-08 requestId with an actionsDisabledReason (D14): the chip reads 'Copy {id}'", () => {
    const { card } = draw({ actionsDisabledReason: "Retry in 3s", requestId: REQUEST_ID });
    expect(button(card, `Copy ${REQUEST_ID}`)).not.toBeNull();
  });

  test("UC-08 no requestId, no request ID chip", () => {
    const { card } = draw({
      state: "stale",
      staleNote: "Version 5 arrived.",
      staleAction: "Review",
    });
    expect(within(card).queryByRole("button", { name: /^Copy / })).toBeNull();
  });

  test("UC-08 phone (D11): Reject on the left and Approve on the right in a two-column grid, 1fr and 1.4fr, gap 10px", () => {
    const { card } = draw({ layout: "phone" });
    const approve = button(card, "Approve");
    const reject = button(card, "Reject…");
    expect(reject.compareDocumentPosition(approve) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const grid = found(approve.parentElement, "the actions container");
    expect(grid).toBe(reject.parentElement);
    const columns = grid.style.gridTemplateColumns || grid.className.toString();
    expect(columns).toContain("1.4fr");
    expect(columns).toContain("1fr");
    expect(grid.style.gap || grid.className.toString()).toContain("10px");
  });

  test("UC-08 desk: the actions are not the phone's two-column grid", () => {
    const { card } = draw({ layout: "desk" });
    const grid = found(button(card, "Approve").parentElement, "the actions container");
    expect(grid.style.gridTemplateColumns).not.toContain("1.4fr");
    expect(grid.className.toString()).not.toContain("1.4fr");
  });
});

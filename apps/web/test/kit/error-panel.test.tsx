import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ErrorPanel, type ErrorPanelProps, found, WidgetState, type WidgetStateProps } from "./kit";

// UC-10: ErrorPanel (E1; DL's y8 and its copy v8) and WidgetState's error state with a request ID (W1).

const REQUEST_ID = "0193a7c0-4b1e-7000-8000-00000000abcd";

function panel(extra: ErrorPanelProps = {}) {
  const result = render(<ErrorPanel {...extra} />);
  const el = found(
    result.container.querySelector<HTMLElement>('[data-ui="ErrorPanel"]'),
    'an [data-ui="ErrorPanel"]',
  );
  return { ...result, el };
}

function widget(extra: WidgetStateProps = {}) {
  const result = render(<WidgetState state="error" {...extra} />);
  const el = found(
    result.container.querySelector<HTMLElement>('[data-ui="WidgetState"]'),
    'a [data-ui="WidgetState"]',
  );
  return { ...result, el };
}

describe("UC-10 ErrorPanel", () => {
  test("UC-10 the panel is an alert carrying its code, with the title and the body as given", () => {
    const { el } = panel({
      code: 409,
      title: "This couldn't be recorded.",
      body: "Another decision is already open on this mission.",
    });
    expect(el.getAttribute("role")).toBe("alert");
    expect(el.getAttribute("data-code")).toBe("409");
    expect(within(el).queryByText("409")).not.toBeNull();
    expect(within(el).queryByText("This couldn't be recorded.")).not.toBeNull();
    expect(
      within(el).queryByText("Another decision is already open on this mission."),
    ).not.toBeNull();
  });

  test("UC-10 body is drawn as given, never DL's specimen body", () => {
    const { el } = panel({ code: 403, title: "Not allowed", body: "No." });
    expect(el.textContent).toContain("No.");
    expect(el.textContent).not.toContain("Releases need the release owner role");
  });

  test("UC-10 (E1) no button without onAction", () => {
    const { el } = panel({ code: 400, body: "The server could not read this request." });
    expect(within(el).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-10 (E1) no button without onAction, even with an actionLabel", () => {
    const { el } = panel({ code: 400, body: "x", actionLabel: "Refresh list" });
    expect(within(el).queryAllByRole("button")).toHaveLength(0);
  });

  test("UC-10 (E1) with onAction, the button reads actionLabel and calls back", async () => {
    const onAction = vi.fn();
    const { el } = panel({ code: 409, body: "x", actionLabel: "Refresh list", onAction });
    const button = found(
      within(el).queryByRole("button", { name: "Refresh list" }),
      "Refresh list",
    );
    await userEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test.each([
    [400, "Reload"],
    [401, "Sign in"],
    [403, "Copy link for an admin"],
    [404, "Open mission"],
    [409, "Review new version"],
    [422, "Add reason"],
  ])("UC-10 (E1) with onAction and no actionLabel, code %i reads DL's copy %s", (code, copy) => {
    const { el } = panel({ code, body: "x", onAction: vi.fn() });
    expect(within(el).queryByRole("button", { name: copy })).not.toBeNull();
  });

  test.each([
    [400, "Request rejected"],
    [401, "Signed out"],
    [403, "Not allowed"],
  ])("UC-10 with no title, code %i reads DL's title %s", (code, title) => {
    const { el } = panel({ code, body: "x" });
    expect(within(el).queryByText(title)).not.toBeNull();
  });

  test("UC-10 requestId draws the chip 'Copy {requestId}', as 'req' and 12 characters", () => {
    const { el } = panel({ code: 400, body: "x", requestId: REQUEST_ID });
    expect(within(el).queryByRole("button", { name: `Copy ${REQUEST_ID}` })).not.toBeNull();
    const chip = found(
      el.querySelector('[data-ui="HashChip"][data-kind="hash"]'),
      "the request ID chip",
    );
    expect(chip.textContent).toContain("req");
    expect(chip.textContent).toContain(REQUEST_ID.slice(0, 12));
    expect(chip.textContent).not.toContain(REQUEST_ID);
  });

  test("UC-10 no requestId, no chip", () => {
    const { el } = panel({ code: 400, body: "x", onAction: vi.fn() });
    expect(within(el).queryByRole("button", { name: /^Copy / })).toBeNull();
    expect(within(el).queryAllByRole("button")).toHaveLength(1);
  });

  test("UC-10 the chip and the action sit together: both buttons with onAction and requestId", () => {
    const { el } = panel({
      code: 422,
      title: "Not allowed now",
      body: "x",
      actionLabel: "Refresh list",
      onAction: vi.fn(),
      requestId: REQUEST_ID,
    });
    expect(within(el).queryAllByRole("button")).toHaveLength(2);
  });
});

describe("UC-10 WidgetState error with a request ID (W1)", () => {
  test("UC-10 error: DL's 'Couldn't load' and its message, as a alert", () => {
    const { el } = widget();
    expect(el.getAttribute("data-state")).toBe("error");
    expect(el.getAttribute("role")).toBe("alert");
    expect(within(el).queryByText("Couldn't load")).not.toBeNull();
    expect(
      within(el).queryByText("The server did not answer. Nothing was changed."),
    ).not.toBeNull();
  });

  test("UC-10 (W1) error with requestId draws the chip 'Copy {requestId}' under the message", () => {
    const { el } = widget({ requestId: REQUEST_ID });
    const chip = found(
      within(el).queryByRole("button", { name: `Copy ${REQUEST_ID}` }),
      "the request ID chip",
    );
    const message = found(
      within(el).queryByText("The server did not answer. Nothing was changed."),
      "the message",
    );
    expect(message.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("UC-10 error without requestId draws no chip", () => {
    const { el } = widget();
    expect(within(el).queryByText("Couldn't load")).not.toBeNull();
    expect(within(el).queryByRole("button", { name: /^Copy / })).toBeNull();
  });

  test("UC-10 error with onAction: Retry calls back", async () => {
    const onAction = vi.fn();
    const { el } = widget({ onAction });
    await userEvent.click(found(within(el).queryByRole("button", { name: "Retry" }), "Retry"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("UC-10 (W1) error with rows on screen: 'Stale, last good value 2m old', the chip and Retry; the rows stay", () => {
    const { el } = widget({
      lastGoodAge: 120_000,
      requestId: REQUEST_ID,
      onAction: vi.fn(),
      children: <p>Rows stay on screen</p>,
    });
    expect(within(el).queryByText("Stale, last good value 2m old")).not.toBeNull();
    expect(within(el).queryByText("Rows stay on screen")).not.toBeNull();
    expect(within(el).queryByRole("button", { name: `Copy ${REQUEST_ID}` })).not.toBeNull();
    expect(within(el).queryByRole("button", { name: "Retry" })).not.toBeNull();
  });
});

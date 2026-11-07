import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createTestMock, type TestMock } from "../../setup/app";
import { proposalRow, uuid7 } from "../../setup/seed";
import {
  buttonIn,
  chip,
  confirmDialog,
  decide,
  flush,
  hasButton,
  isDisabled,
  lastRequestId,
  openDialog,
  renderPage,
  requestsTo,
  row,
  rowOrNull,
  rowText,
  TITLE_OF,
  tagState,
  typeReason,
  useFakeClock,
  waitForRows,
} from "./helpers";

// UC-15 to UC-18, UC-21 to UC-23: route 54's and route 52's errors, by UiError.kind (UI contract
// 5.3 and 5.4), on the mock. Each error shows its request ID chip, found by "Copy {requestId}".

const REASON = "Looks fine to me";
const DL_400_BODY =
  "The server could not read this request. Reload and try again. If it repeats, send the request ID with your report.";

function panelIn(container: HTMLElement, code: number): HTMLElement {
  const panel = container.querySelector(`[data-ui="ErrorPanel"][data-code="${code}"]`);
  expect(panel, `an ErrorPanel with code ${code}`).not.toBeNull();
  return panel as HTMLElement;
}

describe("UC-15 stale", () => {
  test("UC-15 a bumped version shows the stale state with the request ID after exactly one request, and Review brings the new version back to be decided", async () => {
    const app = renderPage([proposalRow(1), proposalRow(2)]);
    await waitForRows(TITLE_OF(1), TITLE_OF(2));

    const dialog = await openDialog(app.user, TITLE_OF(1), "Approve");
    await typeReason(app.user, dialog, REASON);
    expect(app.mock.bumpVersion(uuid7(1))).toBe(4);
    await confirmDialog(app.user, dialog, "Approve");

    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("stale"));
    const text = rowText(TITLE_OF(1));
    expect(text).toContain("Version 4 arrived while you were reading.");
    expect(chip(lastRequestId(app.mock, 54))).toBeDefined();
    const li = row(TITLE_OF(1));
    expect(isDisabled(buttonIn(li, "Approve"))).toBe(true);
    expect(isDisabled(buttonIn(li, "Reject…"))).toBe(true);
    expect(requestsTo(app.mock, 54), "exactly one request to route 54").toHaveLength(1);

    await app.user.click(buttonIn(li, "Review version 4"));
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("seen"));
    expect(rowText(TITLE_OF(1))).toContain("Binds to Version 4");
    expect(requestsTo(app.mock, 54), "Review re-sends nothing").toHaveLength(1);

    await decide(app.user, TITLE_OF(1), "Approve", REASON);
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("approved"));
    const sent = requestsTo(app.mock, 54);
    expect(sent).toHaveLength(2);
    expect(sent[1]?.body).toEqual({ version: 4, choice: "approve", reason: REASON });
  });
});

describe("UC-16 stale, then gone", () => {
  test("UC-16 after the 409 the proposal is resolved elsewhere: Review drops the row and says it was settled elsewhere", async () => {
    const app = renderPage([proposalRow(1), proposalRow(2)]);
    await waitForRows(TITLE_OF(1), TITLE_OF(2));
    const dialog = await openDialog(app.user, TITLE_OF(1), "Approve");
    await typeReason(app.user, dialog, REASON);
    app.mock.bumpVersion(uuid7(1));
    await confirmDialog(app.user, dialog, "Approve");
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("stale"));

    app.mock.resolve(uuid7(1));
    await app.user.click(buttonIn(row(TITLE_OF(1)), /^Review version/));
    await waitFor(() => expect(rowOrNull(TITLE_OF(1))).toBeNull());
    const notes = screen
      .getAllByRole("status")
      .filter((el) => el.textContent?.includes("That decision was settled elsewhere."));
    expect(notes, "a role=status note").toHaveLength(1);
    expect(rowOrNull(TITLE_OF(2))).not.toBeNull();
  });
});

describe("UC-17 422 and 404", () => {
  const notDecidable = { status: 422, code: "INVALID_TRANSITION" };
  const cases: Array<{
    name: string;
    prepare: (mock: TestMock) => void;
    failure?: { status: number; code: string; data: unknown };
    reason: string;
    gone: boolean;
  }> = [
    {
      name: "resolved elsewhere, no state sent",
      prepare: (m) => m.resolve(uuid7(1)),
      reason: "This can't be decided now.",
      gone: true,
    },
    {
      name: "resolved, state resolved",
      prepare: (m) => m.resolve(uuid7(1)),
      failure: { ...notDecidable, data: { state: "resolved", allowed: [] } },
      reason: "This decision was already made.",
      gone: true,
    },
    {
      name: "expired, state expired",
      prepare: (m) => m.expire(uuid7(1)),
      failure: { ...notDecidable, data: { state: "expired", allowed: [] } },
      reason: "This decision expired.",
      gone: true,
    },
    {
      name: "removed",
      prepare: (m) => m.remove(uuid7(1)),
      reason: "This decision no longer exists.",
      gone: true,
    },
    {
      name: "a 422 alone, with the store left open",
      prepare: () => {},
      failure: { ...notDecidable, data: { allowed: [] } },
      reason: "This can't be decided now.",
      gone: false,
    },
  ];

  test.each(cases)(
    "UC-17 $name shows its reason and the request ID, and Refresh list refetches",
    async ({ prepare, failure, reason, gone }) => {
      const app = renderPage([proposalRow(1), proposalRow(2)]);
      await waitForRows(TITLE_OF(1), TITLE_OF(2));
      const dialog = await openDialog(app.user, TITLE_OF(1), "Approve");
      await typeReason(app.user, dialog, REASON);
      prepare(app.mock);
      if (failure) app.mock.failNext(54, failure);
      await confirmDialog(app.user, dialog, "Approve");

      await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("notAllowed"));
      expect(rowText(TITLE_OF(1))).toContain(reason);
      expect(chip(lastRequestId(app.mock, 54))).toBeDefined();
      const li = row(TITLE_OF(1));
      expect(hasButton(li, "Approve")).toBe(false);
      expect(requestsTo(app.mock, 54)).toHaveLength(1);

      await app.user.click(buttonIn(li, "Refresh list"));
      if (gone) {
        await waitFor(() => expect(rowOrNull(TITLE_OF(1))).toBeNull());
      } else {
        await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("seen"));
        expect(rowText(TITLE_OF(1))).not.toContain(reason);
        expect(isDisabled(buttonIn(row(TITLE_OF(1)), "Approve"))).toBe(false);
      }
      expect(rowOrNull(TITLE_OF(2))).not.toBeNull();
    },
  );
});

describe("UC-18 429", () => {
  test("UC-18 the buttons are disabled with 'Retry in 3s' and the request ID, count down to enabled, and nothing is re-sent", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    app.mock.failNext(54, {
      status: 429,
      code: "TOO_MANY_REQUESTS",
      data: { retryAfterMs: 3000 },
    });
    const clock = useFakeClock();
    await decide(clock.user, TITLE_OF(1), "Approve", REASON);
    await flush();

    expect(tagState(TITLE_OF(1))).toBe("seen");
    expect(rowText(TITLE_OF(1))).toContain("Retry in 3s");
    expect(chip(lastRequestId(app.mock, 54))).toBeDefined();
    expect(isDisabled(buttonIn(row(TITLE_OF(1)), "Approve"))).toBe(true);
    expect(isDisabled(buttonIn(row(TITLE_OF(1)), "Reject…"))).toBe(true);

    await clock.advance(1000);
    await flush();
    expect(rowText(TITLE_OF(1))).toContain("Retry in 2s");
    await clock.advance(1000);
    await flush();
    expect(rowText(TITLE_OF(1))).toContain("Retry in 1s");
    await clock.advance(1000);
    await flush();
    expect(rowText(TITLE_OF(1))).not.toContain("Retry in");
    expect(isDisabled(buttonIn(row(TITLE_OF(1)), "Approve"))).toBe(false);
    expect(isDisabled(buttonIn(row(TITLE_OF(1)), "Reject…"))).toBe(false);
    expect(requestsTo(app.mock, 54), "no request re-sent").toHaveLength(1);
  });
});

describe("UC-21 reason 400", () => {
  test("UC-21 the dialog reopens with the reason, the error and the request ID, and confirming sends a new key", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    app.mock.failNext(54, { status: 400, code: "BAD_REQUEST", data: { field: "reason" } });
    await decide(app.user, TITLE_OF(1), "Approve", REASON);

    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect((within(dialog).getByRole("textbox") as HTMLTextAreaElement).value).toBe(REASON),
    );
    const error = within(dialog).getByText(
      "The server didn't accept this reason. Write a few more words.",
    );
    expect(error.closest('[role="alert"]') ?? error.getAttribute("role")).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: `Copy ${lastRequestId(app.mock, 54)}` }),
    ).toBeDefined();
    expect(tagState(TITLE_OF(1))).toBe("seen");

    await confirmDialog(app.user, dialog, "Approve");
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("approved"));
    const sent = requestsTo(app.mock, 54);
    expect(sent).toHaveLength(2);
    expect(sent[1]?.idempotencyKey).toBeTypeOf("string");
    expect(sent[1]?.idempotencyKey).not.toBe(sent[0]?.idempotencyKey);
    expect(sent[1]?.body).toEqual({ version: 3, choice: "approve", reason: REASON });
  });
});

describe("UC-22 panels", () => {
  const cases = [
    {
      name: "400 other",
      failure: { status: 400, code: "BAD_REQUEST", data: { field: "choice" } },
      code: 400,
      title: "Request rejected",
      body: DL_400_BODY,
      action: "Reload",
    },
    {
      name: "403",
      failure: { status: 403, code: "FORBIDDEN", message: "Not yours to decide." },
      code: 403,
      title: "Not allowed",
      body: "Not yours to decide.",
      action: null,
    },
    {
      name: "IDEMPOTENCY_KEY_REUSED",
      failure: { status: 409, code: "IDEMPOTENCY_KEY_REUSED" },
      code: 400,
      title: "Request rejected",
      body: DL_400_BODY,
      action: "Reload",
    },
    {
      name: "CONFLICT",
      failure: { status: 409, code: "CONFLICT", message: "Recorded by someone else." },
      code: 409,
      title: "This couldn't be recorded.",
      body: "Recorded by someone else.",
      action: "Refresh list",
    },
    {
      name: "UNPROCESSABLE_CONTENT",
      failure: { status: 422, code: "UNPROCESSABLE_CONTENT", message: "Not possible now." },
      code: 422,
      title: "Not allowed now",
      body: "Not possible now.",
      action: "Refresh list",
    },
  ] as const;

  test.each(cases)(
    "UC-22 $name shows its compact ErrorPanel with the title, body, action and request ID",
    async ({ failure, code, title, body, action }) => {
      const app = renderPage([proposalRow(1)]);
      await waitForRows(TITLE_OF(1));
      app.mock.failNext(54, failure);
      await decide(app.user, TITLE_OF(1), "Approve", REASON);

      await waitFor(() => expect(rowText(TITLE_OF(1))).toContain(title));
      const li = row(TITLE_OF(1));
      const panel = panelIn(li, code);
      expect(within(panel).getByText(title)).toBeDefined();
      expect(within(panel).getByText(body)).toBeDefined();
      expect(chip(lastRequestId(app.mock, 54))).toBeDefined();
      expect(tagState(TITLE_OF(1)), "never the stale state").not.toBe("stale");
      expect(rowText(TITLE_OF(1))).not.toContain("arrived while you were reading");
      if (action) {
        expect(within(panel).getByRole("button", { name: action })).toBeDefined();
      } else {
        expect(hasButton(panel, /^(Reload|Refresh list|Retry|Sign in)/)).toBe(false);
      }
      expect(requestsTo(app.mock, 54)).toHaveLength(1);
    },
  );
});

describe("UC-23 401", () => {
  const SIGNED_OUT = "Signed out";
  const SIGNED_OUT_BODY =
    "Your session ended. Sign in again to continue. Nothing you approved was lost.";

  function expectSignedOutPanel(mock: TestMock, route: 52 | 54): void {
    const panel = panelIn(document.body, 401);
    expect(within(panel).getByText(SIGNED_OUT)).toBeDefined();
    expect(within(panel).getByText(SIGNED_OUT_BODY)).toBeDefined();
    expect(panel.closest("li"), "a page-level panel, not a row's").toBeNull();
    expect(chip(lastRequestId(mock, route))).toBeDefined();
    const names = within(panel)
      .queryAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent ?? "");
    expect(
      names.every((n) => n.startsWith("Copy ")),
      `no action button, found ${names.join(", ")}`,
    ).toBe(true);
  }

  test("UC-23 a 401 on route 54 shows the page-level Signed out panel with the request ID and no button", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    app.mock.failNext(54, { status: 401, code: "UNAUTHORIZED" });
    await decide(app.user, TITLE_OF(1), "Approve", REASON);
    await screen.findByText(SIGNED_OUT);
    expectSignedOutPanel(app.mock, 54);
  });

  test("UC-23 a 401 on route 52's first load shows the page-level Signed out panel with the request ID and no button", async () => {
    const mock = createTestMock([proposalRow(1)]);
    mock.failNext(52, { status: 401, code: "UNAUTHORIZED" });
    renderPage([], { mock });
    await screen.findByText(SIGNED_OUT);
    expectSignedOutPanel(mock, 52);
    expect(rowOrNull(TITLE_OF(1))).toBeNull();
  });
});

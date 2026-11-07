import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { formatClock } from "../../../src/lib/time";
import { proposalRow, uuid7 } from "../../setup/seed";
import {
  buttonIn,
  chip,
  confirmDialog,
  decide,
  decidePath,
  flush,
  isDisabled,
  lastRequestId,
  openDialog,
  renderPage,
  requestsTo,
  resolvedAtOf,
  rowOrNull,
  rowText,
  TITLE_OF,
  tagState,
  typeReason,
  useFakeClock,
  waitForRows,
} from "./helpers";

// UC-13, UC-14, UC-19, UC-20: deciding on route 54 (UI contract 5.2 and 5.3), on the mock.

const REASON = "Looks fine to me";

describe("UC-13 approve", () => {
  test("UC-13 the dialog carries 5.2's copy, confirming sends one request, shows Approving…, then the approved line, and the row leaves", async () => {
    const app = renderPage([proposalRow(1), proposalRow(2)], { holdDecisions: true });
    await waitForRows(TITLE_OF(1), TITLE_OF(2));

    const dialog = await openDialog(app.user, TITLE_OF(1), "Approve");
    expect(within(dialog).getByText("Approve this decision?")).toBeDefined();
    expect(
      within(dialog).getByText(
        `${TITLE_OF(1)}. The work goes ahead. Your reason goes on the record.`,
      ),
    ).toBeDefined();
    expect(requestsTo(app.mock, 54), "opening the dialog sends nothing").toHaveLength(0);

    await typeReason(app.user, dialog, `  ${REASON}  `);
    await confirmDialog(app.user, dialog, "Approve");

    // The row is Approving… while the answer is held; the dialog has closed.
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("approving"));
    expect(rowText(TITLE_OF(1))).toContain("Approving…");
    expect(screen.queryByRole("dialog")).toBeNull();
    const sent = requestsTo(app.mock, 54);
    expect(sent, "exactly one request to route 54").toHaveLength(1);
    expect(sent[0]?.method).toBe("POST");
    expect(sent[0]?.path).toBe(decidePath(uuid7(1)));
    expect(sent[0]?.body).toEqual({ version: 3, choice: "approve", reason: REASON });
    expect(sent[0]?.idempotencyKey).toBeTypeOf("string");
    expect(sent[0]?.idempotencyKey).not.toBe("");

    app.decideGate.open();
    await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("approved"));
    const text = rowText(TITLE_OF(1));
    const match = /Approved by you at (\d{2}:\d{2})\.\s*Logged with Version 3\./.exec(text);
    expect(match, `the approved line, in "${text}"`).not.toBeNull();
    const resolvedAt = await resolvedAtOf(app.mock, uuid7(1));
    expect(match?.[1]).toBe(formatClock(resolvedAt));

    await waitFor(() => expect(rowOrNull(TITLE_OF(1))).toBeNull());
    expect(rowOrNull(TITLE_OF(2))).not.toBeNull();
    expect(screen.getByText("1 thing needs you.")).toBeDefined();
    expect(requestsTo(app.mock, 54)).toHaveLength(1);
  });

  test("UC-13 a reason under three characters can't be confirmed, and nothing is sent", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    const dialog = await openDialog(app.user, TITLE_OF(1), "Approve");
    await typeReason(app.user, dialog, " ab ");
    expect(isDisabled(within(dialog).getByRole("button", { name: "Approve" }))).toBe(true);
    expect(requestsTo(app.mock, 54)).toHaveLength(0);
  });
});

describe("UC-14 reject", () => {
  test("UC-14 the dialog carries DL's reject copy, confirming sends the reject body, shows Rejecting…, then the rejected line", async () => {
    const app = renderPage([proposalRow(1), proposalRow(2)], { holdDecisions: true });
    await waitForRows(TITLE_OF(1), TITLE_OF(2));

    const dialog = await openDialog(app.user, TITLE_OF(2), "Reject");
    expect(within(dialog).getByText("Reject this decision?")).toBeDefined();
    expect(
      within(dialog).getByText(
        `${TITLE_OF(2)}. The work stops. Your reason goes on the record and is shown to whoever picks it up next.`,
      ),
    ).toBeDefined();
    await typeReason(app.user, dialog, REASON);
    await confirmDialog(app.user, dialog, "Reject");

    await waitFor(() => expect(tagState(TITLE_OF(2))).toBe("rejecting"));
    expect(rowText(TITLE_OF(2))).toContain("Rejecting…");
    expect(isDisabled(buttonIn(rowOrNull(TITLE_OF(2)) as HTMLElement, "Approve"))).toBe(true);
    const sent = requestsTo(app.mock, 54);
    expect(sent, "exactly one request to route 54").toHaveLength(1);
    expect(sent[0]?.path).toBe(decidePath(uuid7(2)));
    expect(sent[0]?.body).toEqual({ version: 3, choice: "reject", reason: REASON });
    expect(sent[0]?.idempotencyKey).toBeTypeOf("string");

    app.decideGate.open();
    await waitFor(() => expect(tagState(TITLE_OF(2))).toBe("rejected"));
    expect(rowText(TITLE_OF(2))).toContain("Rejected. Reason sent to the agents and logged.");
    await waitFor(() => expect(rowOrNull(TITLE_OF(2))).toBeNull());
    expect(rowOrNull(TITLE_OF(1))).not.toBeNull();
  });
});

describe("UC-19 network and 5xx", () => {
  const cases = [
    { name: "a network failure", failure: { network: true } as const },
    {
      name: "a 500",
      failure: { status: 500, code: "INTERNAL", data: {} } as const,
    },
  ];

  test.each(cases)(
    'UC-19 $name shows "Couldn\'t reach the server." with the request ID, and Retry re-sends the same key, path and body',
    async ({ failure }) => {
      const app = renderPage([proposalRow(1)]);
      await waitForRows(TITLE_OF(1));
      app.mock.failNext(54, failure);
      await decide(app.user, TITLE_OF(1), "Approve", REASON);

      await waitFor(() => expect(rowText(TITLE_OF(1))).toContain("Couldn't reach the server."));
      expect(tagState(TITLE_OF(1))).toBe("seen");
      const failed = requestsTo(app.mock, 54);
      expect(failed).toHaveLength(1);
      expect(chip(lastRequestId(app.mock, 54))).toBeDefined();

      await app.user.click(buttonIn(rowOrNull(TITLE_OF(1)) as HTMLElement, "Retry"));
      await waitFor(() => expect(tagState(TITLE_OF(1))).toBe("approved"));
      const all = requestsTo(app.mock, 54);
      expect(all, "Retry sends one more request").toHaveLength(2);
      expect(all[1]?.idempotencyKey).toBe(failed[0]?.idempotencyKey);
      expect(all[1]?.path).toBe(failed[0]?.path);
      expect(all[1]?.body).toEqual(failed[0]?.body);
    },
  );
});

describe("UC-20 IDEMPOTENCY_IN_PROGRESS", () => {
  test("UC-20 once: re-sent with the same key after 500ms, then approved", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    app.mock.failNext(54, { status: 409, code: "IDEMPOTENCY_IN_PROGRESS" });
    const clock = useFakeClock();
    await decide(clock.user, TITLE_OF(1), "Approve", REASON);
    await flush();
    expect(requestsTo(app.mock, 54)).toHaveLength(1);
    expect(tagState(TITLE_OF(1))).toBe("approving");

    await clock.advance(499);
    await flush();
    expect(requestsTo(app.mock, 54), "nothing re-sent before 500ms").toHaveLength(1);
    await clock.advance(1);
    await flush();
    const sent = requestsTo(app.mock, 54);
    expect(sent).toHaveLength(2);
    expect(sent[1]?.idempotencyKey).toBe(sent[0]?.idempotencyKey);
    expect(sent[1]?.body).toEqual(sent[0]?.body);
    await clock.advance(0);
    await flush();
    expect(tagState(TITLE_OF(1))).toBe("approved");
  });

  test("UC-20 running out: three re-sends 500ms, 1s and 2s apart, Approving… throughout, then the network band with the fourth request's ID", async () => {
    const app = renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    app.mock.failNext(54, { status: 409, code: "IDEMPOTENCY_IN_PROGRESS" }, { times: 4 });
    const clock = useFakeClock();
    await decide(clock.user, TITLE_OF(1), "Approve", REASON);
    await flush();
    expect(requestsTo(app.mock, 54)).toHaveLength(1);

    for (const [wait, total] of [
      [500, 2],
      [1000, 3],
      [2000, 4],
    ] as const) {
      await clock.advance(wait - 1);
      await flush();
      expect(requestsTo(app.mock, 54), `before ${wait}ms`).toHaveLength(total - 1);
      expect(tagState(TITLE_OF(1))).toBe("approving");
      await clock.advance(1);
      await flush();
      expect(requestsTo(app.mock, 54), `after ${wait}ms`).toHaveLength(total);
    }

    const sent = requestsTo(app.mock, 54);
    expect(new Set(sent.map((r) => r.idempotencyKey)).size, "one key throughout").toBe(1);
    expect(rowText(TITLE_OF(1))).toContain("Couldn't reach the server.");
    expect(tagState(TITLE_OF(1))).toBe("seen");
    expect(chip(sent[3]?.requestId as string)).toBeDefined();

    await clock.advance(10_000);
    await flush();
    expect(requestsTo(app.mock, 54), "no fifth request").toHaveLength(4);
  });
});

import { fixtures, type SeedRow } from "@avel/contract-mock";
import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createTestMock } from "../../setup/app";
import { proposalRow } from "../../setup/seed";
import {
  alertTexts,
  buttonIn,
  chip,
  hasButton,
  isDisabled,
  items,
  lastRequestId,
  renderPage,
  requestsTo,
  row,
  rowOrNull,
  rowText,
  TITLE_OF,
  waitForRows,
  waitingHeadText,
} from "./helpers";

// UC-11, UC-12, UC-24 to UC-28: the list's own states (UI contract section 5 and 5.4), on the mock.

type Proposal = Extract<SeedRow, { kind: "proposal" }>;
type Factory = Extract<SeedRow, { kind: "factory_change" }>;

function refOf(seed: SeedRow): string {
  return seed.kind === "proposal" ? `proposal:${seed.id}` : `factory_change:${seed.prNumber}`;
}

function parsedChoices(options: unknown): { approve?: Choice; reject?: Choice } {
  const choices = (options as { choices?: Choice[] } | null)?.choices;
  if (!Array.isArray(choices)) return {};
  const approve = choices.filter((c) => c.effect === "approve");
  const reject = choices.filter((c) => c.effect === "reject");
  if (approve.length !== 1 || reject.length !== 1) return {};
  return { approve: approve[0] as Choice, reject: reject[0] as Choice };
}

type Choice = { choice: string; label: string; effect: string; consequence: string };

describe("UC-11 empty", () => {
  test("UC-11 fixtures.empty shows the empty card and the lead 'Nothing needs you right now.'", async () => {
    renderPage(fixtures.empty);
    expect(await screen.findByText("Nothing needs you right now.")).toBeDefined();
    expect(screen.getByText("Nothing needs you.")).toBeDefined();
    expect(
      screen.getByText(/A decision appears here the moment the factory needs one\./),
    ).toBeDefined();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("UC-12 the step 1 fixture", () => {
  test("UC-12 draws four rows in server order, each as its kind, and the lead and count say 4", async () => {
    expect(fixtures.step1, "fixtures.step1 should hold four rows").toHaveLength(4);
    const expected = [...fixtures.step1].sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
      return refOf(a) < refOf(b) ? -1 : 1;
    });
    renderPage(fixtures.step1);
    await waitForRows(...expected.map((seed) => seed.title));

    // Server order.
    const listed = items().map((li) => li.textContent ?? "");
    const positions = expected.map((seed) => listed.findIndex((t) => t.includes(seed.title)));
    expect(positions, "every fixture row is listed").not.toContain(-1);
    expect(positions, "rows follow the server's order").toEqual(
      [...positions].sort((a, b) => a - b),
    );
    expect(listed).toHaveLength(4);

    for (const seed of fixtures.step1) {
      const li = row(seed.title);
      if (seed.kind === "factory_change") {
        const factory: Factory = seed;
        expect(rowText(factory.title)).toContain(`#${factory.prNumber}`);
        expect(rowText(factory.title)).toContain("Commit");
        expect(
          within(li).getByRole("button", { name: `Copy ${factory.headSha}` }),
          "the commit chip",
        ).toBeDefined();
        const link = within(li).getByRole("link", { name: /Open on GitHub/ });
        expect(link.getAttribute("href")).toBe(factory.url);
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
        expect(hasButton(li, /^Approve/)).toBe(false);
        expect(hasButton(li, /^Reject/)).toBe(false);
        continue;
      }
      const proposal: Proposal = seed;
      const { approve, reject } = parsedChoices(proposal.options);
      if (approve && reject) {
        expect(rowText(proposal.title)).toContain(`Binds to Version ${proposal.version}`);
        expect(rowText(proposal.title)).toContain(proposal.evidence);
        expect(rowText(proposal.title)).toContain(approve.consequence);
        if (proposal.clientName) expect(rowText(proposal.title)).toContain(proposal.clientName);
        expect(isDisabled(buttonIn(li, approve.label))).toBe(false);
        expect(isDisabled(buttonIn(li, `${reject.label}…`))).toBe(false);
      } else {
        expect(rowText(proposal.title)).toContain(
          "This decision's options can't be read, so it can't be decided here.",
        );
        expect(rowText(proposal.title)).toContain("Locked");
        expect(hasButton(li, /^Approve/)).toBe(false);
        expect(hasButton(li, /^Reject/)).toBe(false);
      }
    }

    expect(screen.getByText("4 things need you.")).toBeDefined();
    expect(waitingHeadText()).toMatch(/Waiting for you\s*4(?!\+|\d)/);
    expect(screen.getByRole("heading", { level: 1, name: "Decisions" })).toBeDefined();
    expect(document.querySelector('[data-ui="DecisionsPage"]')).not.toBeNull();
  });

  test("UC-12 a single row says 'thing needs you'", async () => {
    renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    expect(screen.getByText("1 thing needs you.")).toBeDefined();
  });
});

describe("UC-24 unreadable rows", () => {
  test("UC-24 an injected raw item shows the alert band and the other rows still show", async () => {
    const mock = createTestMock([proposalRow(1), proposalRow(2)]);
    mock.injectRawItem({ kind: "proposal" });
    renderPage([], { mock });
    await waitForRows(TITLE_OF(1), TITLE_OF(2));
    const band = alertTexts().find((t) => t.includes("couldn't be shown"));
    expect(band).toBe(
      "1 decision couldn't be shown. Reload the page; if it keeps happening, report it.",
    );
    expect(items()).toHaveLength(2);
  });
});

describe("UC-25 offline", () => {
  test('UC-25 with navigator.onLine false, every button is disabled with the reason "You\'re offline."', async () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    const app = renderPage([proposalRow(1), proposalRow(2)]);
    await waitForRows(TITLE_OF(1), TITLE_OF(2));
    for (const n of [1, 2]) {
      const li = row(TITLE_OF(n));
      expect(rowText(TITLE_OF(n))).toContain("You're offline.");
      expect(isDisabled(buttonIn(li, "Approve"))).toBe(true);
      expect(isDisabled(buttonIn(li, "Reject…"))).toBe(true);
    }
    expect(requestsTo(app.mock, 54)).toHaveLength(0);
  });
});

describe("UC-26 paging", () => {
  test("UC-26 fixtures.many pages 50, 100, 150 with the count's plus, and Load more goes at the end", async () => {
    expect(fixtures.many, "fixtures.many should hold 150 rows").toHaveLength(150);
    const app = renderPage(fixtures.many);
    await waitFor(() => expect(items()).toHaveLength(50));
    expect(waitingHeadText()).toMatch(/Waiting for you\s*50\+/);

    await app.user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(items()).toHaveLength(100));
    expect(waitingHeadText()).toMatch(/Waiting for you\s*100\+/);

    await app.user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(items()).toHaveLength(150));
    expect(waitingHeadText()).toMatch(/Waiting for you\s*150(?!\+|\d)/);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    expect(requestsTo(app.mock, 52).every((r) => r.method === "GET")).toBe(true);
  });

  test("UC-26 a failing Load more keeps the rows, reads 'Retry loading more' with the request ID, and then loads", async () => {
    expect(fixtures.many, "fixtures.many should hold 150 rows").toHaveLength(150);
    const app = renderPage(fixtures.many);
    await waitFor(() => expect(items()).toHaveLength(50));
    app.mock.failNext(52, { network: true }, { times: 4 });
    await app.user.click(screen.getByRole("button", { name: "Load more" }));
    const retry = await screen.findByRole("button", { name: "Retry loading more" });
    expect(items()).toHaveLength(50);
    expect(chip(lastRequestId(app.mock, 52))).toBeDefined();
    await app.user.click(retry);
    await waitFor(() => expect(items()).toHaveLength(100));
  });

  test("UC-26 the unreadable count is summed over the loaded pages", async () => {
    expect(fixtures.many, "fixtures.many should hold 150 rows").toHaveLength(150);
    const app = renderPage(fixtures.many);
    await waitFor(() => expect(items()).toHaveLength(50));
    expect(alertTexts().some((t) => t.includes("couldn't be shown"))).toBe(false);

    app.mock.injectRawItem({ kind: "proposal" });
    await app.user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(items().length).toBeGreaterThanOrEqual(100));
    const band = "1 decision couldn't be shown.";
    expect(alertTexts().some((t) => t.startsWith(band))).toBe(true);

    await app.user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(items()).toHaveLength(150));
    expect(alertTexts().some((t) => t.startsWith(band))).toBe(true);
  });
});

describe("UC-27 the list's own states", () => {
  test("UC-27 with nothing loaded yet the page shows WidgetState loading", async () => {
    renderPage([proposalRow(1)], { holdList: true });
    const loading = document.querySelector('[data-ui="WidgetState"][data-state="loading"]');
    expect(loading, "WidgetState loading while route 52 hasn't answered").not.toBeNull();
    expect(screen.queryByRole("list", { name: "Waiting for you" })).toBeNull();
  });

  test("UC-27 a first load failing four times shows 'Couldn't load' with the request ID, and Retry loads it", async () => {
    const failing = createTestMock([proposalRow(1)]);
    failing.failNext(52, { network: true }, { times: 4 });
    const again = renderPage([], { mock: failing });
    await screen.findByText("Couldn't load");
    expect(screen.getByText("The server did not answer. Nothing was changed.")).toBeDefined();
    expect(requestsTo(failing, 52)).toHaveLength(4);
    expect(chip(lastRequestId(failing, 52))).toBeDefined();
    await again.user.click(screen.getByRole("button", { name: "Retry" }));
    await waitForRows(TITLE_OF(1));
  });

  test("UC-27 a 403 on the first load shows 'Not allowed' with the server's message, the request ID and no button", async () => {
    const mock = createTestMock([proposalRow(1)]);
    mock.failNext(52, { status: 403, code: "FORBIDDEN", message: "No." });
    renderPage([], { mock });
    await screen.findByText("Not allowed");
    expect(screen.getByText("No.")).toBeDefined();
    expect(chip(lastRequestId(mock, 52))).toBeDefined();
    expect(screen.queryByRole("button", { name: /^(Retry|Reload|Sign in)/ })).toBeNull();
    expect(document.querySelector('[data-ui="ErrorPanel"][data-code="403"]')).not.toBeNull();
  });

  test("UC-27 a refetch failing four times with rows on screen keeps the rows under 'Stale, last good value', with the request ID and Retry", async () => {
    const app = renderPage([proposalRow(1), proposalRow(2)]);
    await waitForRows(TITLE_OF(1), TITLE_OF(2));
    app.mock.failNext(52, { network: true }, { times: 4 });
    await act(async () => {
      await app.queryClient.invalidateQueries();
    });
    await screen.findByText(/Stale, last good value .* old/);
    expect(items()).toHaveLength(2);
    expect(chip(lastRequestId(app.mock, 52))).toBeDefined();
    await app.user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByText(/Stale, last good value/)).toBeNull());
    expect(rowOrNull(TITLE_OF(1))).not.toBeNull();
  });
});

describe("UC-28 contract version", () => {
  test("UC-28 the same version shows no banner", async () => {
    renderPage([proposalRow(1)]);
    await waitForRows(TITLE_OF(1));
    expect(screen.queryByText("AVEL was updated. Reload to use the new version.")).toBeNull();
  });
});

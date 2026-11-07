import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { proposalRow } from "../../setup/seed";
import { renderPage } from "./helpers";

// UC-28 (the stale side). Its own file on purpose: the page keeps the first mismatching
// X-Contract-Version until reload (module state), so a test that causes one must not share a file
// with tests that expect none. Vitest gives each file fresh modules.

describe("UC-28 contract version", () => {
  test("UC-28 a mock on another contract version shows the staleVersion banner with Reload, above the header", async () => {
    renderPage([proposalRow(1)], { contractVersion: "999.0.0" });
    const banner = await screen.findByText("AVEL was updated. Reload to use the new version.");
    const widget = banner.closest('[data-ui="WidgetState"]');
    expect(widget?.getAttribute("data-state")).toBe("staleVersion");
    expect(within(widget as HTMLElement).getByRole("button", { name: "Reload" })).toBeDefined();
    const h1 = screen.getByRole("heading", { level: 1, name: "Decisions" });
    expect(
      (widget as HTMLElement).compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

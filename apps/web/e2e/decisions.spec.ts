import { expect, firstDecidableProposal, test } from "./fixtures";

// UI contract section 7, "End to end": the approval page at / on the dev server's mock
// (AVEL_API=mock), on a phone (390x844) and on a desk (1280x800). Each test starts with
// POST /__mock/reset (fixtures.ts). fixtures.step1 has four rows: two decidable proposals, one
// whose options don't parse (Locked) and one factory PR.

const REASON = "Checked the evidence and the spend; fine to proceed.";

test("UC-29: / is server-rendered with its rows, and approving a proposal with a reason removes it", async ({
  page,
  request,
}) => {
  // The SSR HTML already holds the rows, served by the dev server's mock: no browser, no scripts.
  const ssr = await request.get("/");
  expect(ssr.status()).toBe(200);
  const html = await ssr.text();
  expect(html, "the page root is in the first HTML").toContain('data-ui="DecisionsPage"');
  // Elements, not attribute text: the kit's inline <style> also holds [data-ui="DecisionTag"] selectors.
  const tags = html.match(/<article\b[^>]*\bdata-ui="DecisionTag"/g);
  expect(tags?.length, "four rows in the first HTML").toBe(4);
  expect(html).toContain("4 things need you.");
  expect(html, "no loading state on first paint").not.toContain('data-ui="WidgetState"');

  const proposal = await firstDecidableProposal(request);
  await page.goto("/");
  const rows = page.getByRole("list", { name: "Waiting for you" }).getByRole("listitem");
  await expect(page.getByRole("heading", { level: 1, name: "Decisions" })).toBeVisible();
  await expect(rows).toHaveCount(4);
  await expect(page.getByText("4 things need you.")).toBeVisible();

  const row = rows.filter({ hasText: proposal.title });
  await row.getByRole("button", { name: new RegExp(`^${proposal.approveLabel}`) }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Approve this decision?")).toBeVisible();
  await dialog.getByRole("textbox").fill(REASON);
  await dialog.getByRole("button", { name: proposal.approveLabel, exact: true }).click();

  // The punch: the row shows the server's approved time, then leaves with the refetch.
  await expect(row.getByText(/Approved by you at \d{2}:\d{2}\./)).toBeVisible();
  await expect(rows).toHaveCount(3);
  await expect(page.getByText("3 things need you.")).toBeVisible();
  await expect(page.getByText(proposal.title)).toHaveCount(0);
});

test("UC-30: a version bumped while the page is open gives the stale state, and Review then approve works", async ({
  page,
  request,
}) => {
  const proposal = await firstDecidableProposal(request);
  const next = proposal.version + 1;

  await page.goto("/");
  const rows = page.getByRole("list", { name: "Waiting for you" }).getByRole("listitem");
  const row = rows.filter({ hasText: proposal.title });
  await expect(row).toBeVisible();
  await expect(row.getByText(`Binds to Version ${proposal.version}`)).toBeVisible();

  await row.getByRole("button", { name: new RegExp(`^${proposal.approveLabel}`) }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(REASON);

  // Another tab or agent changes the proposal while the dialog is open.
  const bump = await request.post(`/__mock/bump/${proposal.proposalId}`);
  expect(bump.status()).toBe(200);
  expect(await bump.json()).toEqual({ version: next });

  await dialog.getByRole("button", { name: proposal.approveLabel, exact: true }).click();

  // The page sent the version it drew: the mock refuses it, and the row says what arrived.
  await expect(row.getByText(`Version ${next} arrived while you were reading.`)).toBeVisible();
  await expect(row.getByRole("button", { name: /^Copy / }), "the request ID chip").toBeVisible();
  await expect(
    row.getByRole("button", { name: new RegExp(`^${proposal.approveLabel}`) }),
  ).toBeDisabled();

  // Review refetches; nothing is re-sent. The row comes back with the new version, in "seen".
  await row.getByRole("button", { name: `Review version ${next}` }).click();
  await expect(row.getByText(`Binds to Version ${next}`)).toBeVisible();
  await expect(row.getByText(/arrived while you were reading/)).toHaveCount(0);

  await row.getByRole("button", { name: new RegExp(`^${proposal.approveLabel}`) }).click();
  await dialog.getByRole("textbox").fill(REASON);
  await dialog.getByRole("button", { name: proposal.approveLabel, exact: true }).click();
  await expect(row.getByText(/Approved by you at \d{2}:\d{2}\./)).toBeVisible();
});

test("UC-31: on a phone the actions are D11's two-column grid, 44px tall, and the reason input is 16px", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "UC-31 is the phone's: 390x844");

  const proposal = await firstDecidableProposal(request);
  await page.goto("/");
  const row = page
    .getByRole("list", { name: "Waiting for you" })
    .getByRole("listitem")
    .filter({ hasText: proposal.title });
  const approve = row.getByRole("button", { name: new RegExp(`^${proposal.approveLabel}`) });
  const reject = row.getByRole("button", { name: new RegExp(`^${proposal.rejectLabel}`) });
  await expect(approve).toBeVisible();
  await expect(reject).toBeVisible();

  // D11: .pd[data-phone] .pd-actions, a grid of minmax(0, 1fr) minmax(0, 1.4fr) with a 10px gap,
  // Reject on the left and Approve on the right, both filling their column.
  const grid = await approve.evaluate((button, rejectSelector) => {
    const other = document.querySelector(rejectSelector);
    let el: HTMLElement | null = button.parentElement;
    while (el && !(other && el.contains(other))) el = el.parentElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      display: style.display,
      columns: style.gridTemplateColumns.split(" ").length,
      columnGap: style.columnGap,
    };
  }, '[data-ui="DecisionTag"] button');
  expect(grid, "approve and reject share a container").not.toBeNull();
  expect(grid?.display).toBe("grid");
  expect(grid?.columns).toBe(2);
  expect(grid?.columnGap).toBe("10px");

  const approveBox = await approve.boundingBox();
  const rejectBox = await reject.boundingBox();
  expect(approveBox).not.toBeNull();
  expect(rejectBox).not.toBeNull();
  if (!approveBox || !rejectBox) return;
  expect(rejectBox.x, "Reject is on the left").toBeLessThan(approveBox.x);
  expect(approveBox.width / rejectBox.width, "columns are 1fr and 1.4fr").toBeCloseTo(1.4, 1);
  expect(approveBox.height, "Approve is at least 44px tall").toBeGreaterThanOrEqual(44);
  expect(rejectBox.height, "Reject is at least 44px tall").toBeGreaterThanOrEqual(44);

  // The reason dialog at 390px: a 16px input (no iOS zoom), inside the viewport, usable.
  await approve.click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("textbox");
  await expect(input).toBeVisible();
  expect(await input.evaluate((el) => getComputedStyle(el).fontSize)).toBe("16px");
  const inputBox = await input.boundingBox();
  expect(inputBox).not.toBeNull();
  if (!inputBox) return;
  expect(inputBox.x).toBeGreaterThanOrEqual(0);
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await input.fill(REASON);
  const confirm = dialog.getByRole("button", { name: proposal.approveLabel, exact: true });
  await expect(confirm).toBeEnabled();
  const confirmBox = await confirm.boundingBox();
  expect(
    confirmBox?.height ?? 0,
    "the confirm button is at least 44px tall",
  ).toBeGreaterThanOrEqual(44);
  expect((confirmBox?.x ?? -1) + (confirmBox?.width ?? 0)).toBeLessThanOrEqual(390);
});

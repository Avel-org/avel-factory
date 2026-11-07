import type { SeedRow } from "@avel/contract-mock";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  configure,
  type RenderResult,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { expect, vi } from "vitest";
import { bindApi, createApi } from "../../../src/data/client";
import { createQueryClient } from "../../../src/data/query";
import { createTestMock, ORIGIN, request, type TestMock } from "../../setup/app";

// The decisions screen's test helpers (UI contract section 7, "The page"). The screen is drawn from
// its screens.ts with the mock-backed client; tests assert on what the page shows and on what
// route 54 receives through mock.requests(), never on internals.
//
// ASSUMED NAME: the contract says screens.ts exports the module's screen and names the file
// screens/DecisionsScreen.tsx, so the export is `DecisionsScreen`. It takes no props.

configure({ asyncUtilTimeout: 3000 });

const screens = import.meta.glob<Record<string, unknown>>(
  "../../../src/modules/decisions/screens.ts",
  { eager: true },
);

function loadScreen(): ComponentType | undefined {
  const mod = Object.values(screens)[0];
  const found = mod?.DecisionsScreen;
  return typeof found === "function" ? (found as ComponentType) : undefined;
}

export const TITLE_OF = (n: number): string => `Parked: module-${n}`;

/** A deferred the test opens when it wants a held response to go out. */
function createGate() {
  let release: () => void = () => {};
  let held = false;
  let opened: Promise<void> = Promise.resolve();
  return {
    close(): void {
      held = true;
      opened = new Promise<void>((resolve) => {
        release = resolve;
      });
    },
    open(): void {
      held = false;
      release();
    },
    wait(): Promise<void> {
      return held ? opened : Promise.resolve();
    },
  };
}

export interface PageApp extends RenderResult {
  mock: TestMock;
  queryClient: QueryClient;
  user: ReturnType<typeof userEvent.setup>;
  /** Holds route 54's response (the mock still records the request at once). */
  decideGate: ReturnType<typeof createGate>;
  /** Holds route 52's response. */
  listGate: ReturnType<typeof createGate>;
}

export interface PageOptions {
  mock?: TestMock;
  /** What the mock sends as X-Contract-Version (the client keeps the built version). */
  contractVersion?: string;
  holdDecisions?: boolean;
  holdList?: boolean;
}

function stubMatchMedia(): void {
  // jsdom has no matchMedia. The page is drawn as a desk (not max-width: 899px).
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

/**
 * Draws the decisions screen on a mock seeded with `rows`, in a QueryClient built as the page
 * builds its own (retries without the wait). If the screen isn't built, this fails on an
 * assertion, with the same message every time.
 */
export function renderPage(rows: SeedRow[] = [], opts: PageOptions = {}): PageApp {
  const Screen = loadScreen();
  expect(
    Screen,
    "apps/web/src/modules/decisions/screens.ts should export the screen as DecisionsScreen",
  ).toBeDefined();
  stubMatchMedia();
  const queryClient = createQueryClient({ retryDelay: 0 });
  const mock =
    opts.mock ??
    createTestMock(rows, opts.contractVersion ? { contractVersion: opts.contractVersion } : {});
  const decideGate = createGate();
  const listGate = createGate();
  if (opts.holdDecisions) decideGate.close();
  if (opts.holdList) listGate.close();
  const gated = async (input: Request): Promise<Response> => {
    const response = await mock.fetch(input);
    await (input.method === "GET" ? listGate.wait() : decideGate.wait());
    return response;
  };
  const api = createApi({ fetch: gated as unknown as typeof fetch, baseUrl: ORIGIN });
  bindApi(queryClient, api);
  const Page = Screen as ComponentType;
  const result = render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );
  return {
    ...result,
    mock,
    queryClient,
    user: userEvent.setup(),
    decideGate,
    listGate,
  };
}

// ---- what is on screen ----

function squash(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function items(): HTMLElement[] {
  const list = screen.getByRole("list", { name: "Waiting for you" });
  return within(list).getAllByRole("listitem");
}

export function rowOrNull(title: string): HTMLElement | null {
  const list = screen.queryByRole("list", { name: "Waiting for you" });
  if (!list) return null;
  return (
    within(list)
      .queryAllByRole("listitem")
      .find((li) => li.textContent?.includes(title)) ?? null
  );
}

export function row(title: string): HTMLElement {
  const found = rowOrNull(title);
  expect(found, `a row titled "${title}" should be listed`).not.toBeNull();
  return found as HTMLElement;
}

export function rowText(title: string): string {
  return squash(rowOrNull(title)?.textContent);
}

export function tagState(title: string): string | null {
  return (
    rowOrNull(title)?.querySelector('[data-ui="DecisionTag"]')?.getAttribute("data-state") ?? null
  );
}

/** Waits for the list to show these titles. */
export async function waitForRows(...titles: string[]): Promise<void> {
  await waitFor(() => {
    for (const title of titles) expect(rowOrNull(title), `row "${title}"`).not.toBeNull();
  });
}

export function buttonIn(container: HTMLElement, name: string | RegExp): HTMLElement {
  return within(container).getByRole("button", { name });
}

export function hasButton(container: HTMLElement, name: string | RegExp): boolean {
  return within(container).queryByRole("button", { name }) !== null;
}

export function isDisabled(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true";
}

/** The count beside the "Waiting for you" heading, with the text around it. */
export function waitingHeadText(): string {
  const heading = screen.getByRole("heading", { name: /Waiting for you/ });
  return squash(heading.parentElement?.textContent ?? heading.textContent);
}

export function alertTexts(): string[] {
  return screen.queryAllByRole("alert").map((el) => squash(el.textContent));
}

// ---- what route 54 and 52 received ----

export function requestsTo(mock: TestMock, route: 52 | 53 | 54) {
  return mock.requests().filter((r) => r.route === route);
}

/** The request ID of the latest request to that route, as the mock recorded it. */
export function lastRequestId(mock: TestMock, route: 52 | 53 | 54): string {
  const last = requestsTo(mock, route).at(-1);
  expect(last, `the mock should have received a request to route ${route}`).toBeDefined();
  const id = last?.requestId ?? null;
  expect(id, `route ${route}'s latest request should carry an X-Request-Id`).not.toBeNull();
  return id as string;
}

export function chip(requestId: string): HTMLElement {
  return screen.getByRole("button", { name: `Copy ${requestId}` });
}

export function chipCount(requestId: string): number {
  return screen.queryAllByRole("button", { name: `Copy ${requestId}` }).length;
}

export function decidePath(proposalId: string): string {
  return `/api/proposals/${proposalId}/decisions`;
}

export async function resolvedAtOf(mock: TestMock, proposalId: string): Promise<string> {
  const response = await mock.fetch(request("GET", `/api/proposals/${proposalId}`));
  const body = (await response.json()) as { resolvedAt?: string };
  expect(body.resolvedAt, "route 53 should give the decided proposal's resolvedAt").toBeTypeOf(
    "string",
  );
  return body.resolvedAt as string;
}

// ---- doing things ----

type User = PageApp["user"];

/** Taps Approve or Reject on a row and waits for the reason dialog. */
export async function openDialog(
  user: User,
  title: string,
  action: "Approve" | "Reject",
): Promise<HTMLElement> {
  const name = action === "Approve" ? "Approve" : "Reject…";
  await user.click(buttonIn(row(title), name));
  // Under fake timers findBy can't time out, so look first.
  return screen.queryByRole("dialog") ?? (await screen.findByRole("dialog"));
}

export async function typeReason(user: User, dialog: HTMLElement, reason: string): Promise<void> {
  const box = within(dialog).getByRole("textbox");
  await user.clear(box);
  await user.type(box, reason);
}

export async function confirmDialog(
  user: User,
  dialog: HTMLElement,
  label: "Approve" | "Reject",
): Promise<void> {
  await user.click(within(dialog).getByRole("button", { name: label }));
}

/** Opens the dialog, writes the reason and confirms. */
export async function decide(
  user: User,
  title: string,
  action: "Approve" | "Reject",
  reason = "Looks fine to me",
): Promise<void> {
  const dialog = await openDialog(user, title, action);
  await typeReason(user, dialog, reason);
  await confirmDialog(user, dialog, action);
}

// ---- fake timers ----

/** Fakes the timers the page waits on; promises, Date and microtasks stay real. */
export function useFakeClock(): { user: User; advance: (ms: number) => Promise<void> } {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
  });
  return {
    user: userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) }),
    advance: async (ms: number) => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    },
  };
}

/** Lets pending promises (fetches on the mock) settle without moving the fake clock. */
export async function flush(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  });
}

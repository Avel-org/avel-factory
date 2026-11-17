import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeLoading, HomeView } from "../src/home/HomeView";

type State = Parameters<typeof HomeView>[0]["state"];

const render = (state: State, onRetry: () => void = () => {}) =>
  renderToStaticMarkup(createElement(HomeView, { state, onRetry }));

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

describe("T-F1-03: HomeView and HomeLoading", () => {
  it("ready: the h1 and '{count} waiting'", () => {
    const html = render({ kind: "ready", count: 4, more: false });
    expect(html).toMatch(/<h1\b[^>]*>\s*Decisions\s*<\/h1>/);
    expect(text(html)).toContain("4 waiting");
    expect(text(html)).not.toContain("4+ waiting");
    expect(html).not.toContain('role="alert"');
  });

  it("ready with more: '{count}+ waiting'", () => {
    const html = render({ kind: "ready", count: 50, more: true });
    expect(html).toMatch(/<h1\b[^>]*>\s*Decisions\s*<\/h1>/);
    expect(text(html)).toContain("50+ waiting");
  });

  it("empty: the h1 and 'Nothing needs you'", () => {
    const html = render({ kind: "empty" });
    expect(html).toMatch(/<h1\b[^>]*>\s*Decisions\s*<\/h1>/);
    expect(text(html)).toContain("Nothing needs you");
    expect(text(html)).not.toContain("waiting");
  });

  it("error: the h1, role=alert with the sentence, and a Try again button", () => {
    const html = render({ kind: "error" });
    expect(html).toMatch(/<h1\b[^>]*>\s*Decisions\s*<\/h1>/);
    expect(html).toMatch(
      /<[^>]+role="alert"[^>]*>[\s\S]*Couldn(?:'|&#x27;|&#39;)t load your decisions\.[\s\S]*<\//,
    );
    expect(html).toMatch(/<button\b[^>]*>\s*Try again\s*<\/button>/);
    expect(text(html)).not.toContain("waiting");
  });

  it("error: Try again calls onRetry", () => {
    const onRetry = vi.fn();
    const tree = HomeView({ state: { kind: "error" }, onRetry }) as ReactNode;
    const found: Array<{ onClick?: () => void }> = [];
    const flat = (node: ReactNode): string =>
      Array.isArray(node)
        ? node.map(flat).join("")
        : isValidElement(node)
          ? flat((node as ReactElement<{ children?: ReactNode }>).props.children)
          : typeof node === "string" || typeof node === "number"
            ? String(node)
            : "";
    const walk = (node: ReactNode): void => {
      if (Array.isArray(node)) return void node.forEach(walk);
      if (!isValidElement(node)) return;
      const props = (node as ReactElement<{ children?: ReactNode; onClick?: () => void }>).props;
      if (typeof props.onClick === "function" && flat(props.children).includes("Try again")) {
        found.push({ onClick: props.onClick });
      }
      walk(props.children);
    };
    walk(tree);
    expect(found).toHaveLength(1);
    found[0]?.onClick?.();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("loading: role=status 'Loading…'", () => {
    const html = renderToStaticMarkup(createElement(HomeLoading));
    expect(html).toMatch(/role="status"/);
    expect(text(html)).toContain("Loading…");
  });

  it("agent and client text can't reach the page as HTML", () => {
    const html = render({ kind: "ready", count: 1, more: false });
    expect(html).not.toContain("dangerouslySetInnerHTML");
    expect(html).not.toContain("$");
  });
});

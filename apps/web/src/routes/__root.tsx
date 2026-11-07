import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { ReactNode } from "react";
import appCss from "../styles/app.css?url";
import ibmPlexMono500 from "../styles/fonts/ibm-plex-mono-500.woff2?url";
import interVariable from "../styles/fonts/inter-variable.woff2?url";

// The root shell (UI contract section 6). getRouter() fills the context and provides the
// QueryClient (section 3), so the shell adds no provider of its own. No auth guard.
export interface RouterContext {
  queryClient: QueryClient;
}

const THEME_COOKIE = "avel-theme";

type Theme = "light" | "night";

function toTheme(value: string | undefined): Theme {
  return value === "night" ? "night" : "light";
}

// The theme cookie, read on the server for the first paint and from document.cookie on
// client navigations, so <html> never renders without data-theme.
const readThemeCookie = createIsomorphicFn()
  .server(() => getCookie(THEME_COOKIE))
  .client(() => {
    const prefix = `${THEME_COOKIE}=`;
    return document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length);
  });

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: () => ({ theme: toTheme(readThemeCookie()) }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "preload",
        href: interVariable,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: ibmPlexMono500,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: Outlet,
});

function RootShell({ children }: { children: ReactNode }) {
  const theme = Route.useLoaderData({ select: (data) => data?.theme }) ?? "light";
  return (
    <html lang="en" data-theme={theme}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

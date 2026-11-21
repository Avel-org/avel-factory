import { createRootRoute, HeadContent, Outlet, redirect, Scripts } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { safeNext } from "@/auth";
import { getSession } from "@/auth/api";
import { appOrigin } from "@/auth/origin";

/**
 * Read on the server: the avel-theme cookie (night, else light), and the session, from
 * GET /api/auth/get-session with the request's cookie forwarded (login.md section 1). A failed
 * session read counts as signed out (section 2).
 */
const readRoot = createServerFn().handler(async () => {
  const theme: "light" | "night" = getCookie("avel-theme") === "night" ? "night" : "light";
  const url = new URL(getRequest().url);
  // Where nothing serves /api (vite preview, the bare dev server), this app answers it; asking
  // get-session from there would ask again, so that request is signed out.
  const session = url.pathname.startsWith("/api/")
    ? null
    : await getSession({ cookie: getRequestHeader("cookie"), origin: url.origin }).catch(
        () => null,
      );
  return { theme, session };
});

export const Route = createRootRoute({
  // The guard (login.md section 2). On the server a redirect is the response, so the control room
  // is never drawn signed out. Signed out anywhere but /login: to /login, with next (left out for
  // /). Signed in on /login: to next, or /.
  beforeLoad: async ({ location }) => {
    const { theme, session } = await readRoot();
    const onLogin = location.pathname === "/login";
    if (!session && !onLogin) {
      throw redirect({
        to: "/login",
        search: location.href === "/" ? {} : { next: location.href },
      });
    }
    if (session && onLogin) {
      const next = safeNext(Reflect.get(location.search, "next"), appOrigin());
      throw redirect({ href: next, replace: true });
    }
    return { theme, session };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { theme } = Route.useRouteContext();
  return (
    <html lang="en" data-theme={theme} data-depth="glass">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

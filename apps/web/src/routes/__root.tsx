import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

/** The avel-theme cookie, read on the server: night, else light. */
const readTheme = createServerFn().handler(() =>
  getCookie("avel-theme") === "night" ? "night" : "light",
);

export const Route = createRootRoute({
  beforeLoad: async () => ({ theme: await readTheme() }),
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

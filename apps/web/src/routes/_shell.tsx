import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { AppShell, type AppShellProps } from "../kit/AppShell";
import kitCss from "../kit/kit.css?url";
import { navFromRoutes } from "../modules/system/nav";

export const Route = createFileRoute("/_shell")({
  ssr: true,
  head: () => ({ links: [{ rel: "stylesheet", href: kitCss }] }),
  component: ShellLayout,
});

const renderLink: AppShellProps["renderLink"] = (p) => (
  <Link
    to={p.href as "/"}
    className={p.className}
    aria-current={p["aria-current"]}
    onClick={p.onClick}
  >
    {p.children}
  </Link>
);

function ShellLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { groups, tabs } = navFromRoutes(Object.values(router.routesById));
  const here = groups.flatMap((g) => g.items).find((i) => i.href === pathname);
  return (
    <AppShell
      groups={groups}
      tabs={tabs}
      currentId={here?.id ?? null}
      crumbs={here ? [{ label: here.label }] : []}
      renderLink={renderLink}
    >
      <Outlet />
    </AppShell>
  );
}

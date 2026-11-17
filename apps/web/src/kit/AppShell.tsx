import { type ReactNode, useEffect, useRef, useState } from "react";
import { BrandMark, Icon, type IconName } from "./Icon";

export type ShellItem = { id: string; label: string; href: string; icon?: IconName };
export type ShellTab = { id: string; label: string; href: string; icon: IconName };
export type Crumb = { label: string; href?: string };
type LinkProps = {
  href: string;
  className: string;
  "aria-current"?: "page";
  onClick?(): void;
  children: ReactNode;
};

export type AppShellProps = {
  groups: { label: string; items: ShellItem[] }[];
  tabs: ShellTab[];
  currentId: string | null;
  crumbs: Crumb[];
  renderLink(p: LinkProps): ReactNode;
  children: ReactNode;
};

export function AppShell({ groups, tabs, currentId, crumbs, renderLink, children }: AppShellProps) {
  const [hydrated, setHydrated] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
    const box = canvas.current;
    const bar = progress.current;
    if (!box || !bar) return;
    // Measured only when the user scrolls: the canvas scrolls from 1024px, the window below.
    const update = () => {
      const inCanvas = getComputedStyle(box).overflowY !== "visible";
      const top = inCanvas ? box.scrollTop : window.scrollY;
      const max = inCanvas
        ? box.scrollHeight - box.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, top / max) : 0})`;
    };
    box.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      box.removeEventListener("scroll", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  const current = (id: string) => (id === currentId ? ("page" as const) : undefined);

  return (
    <div
      className="lib-app"
      data-ui="AppShell"
      data-tabbar
      data-hydrated={hydrated ? "" : undefined}
    >
      <aside className="lib-aside">
        <div className="lib-rail">
          <div className="lib-rail-head">
            {renderLink({
              href: "/",
              className: "lib-brand",
              children: (
                <>
                  <span className="lib-brand-mark">
                    <BrandMark />
                  </span>
                  <span className="lib-brand-text">
                    <span className="lib-brand-name">AVEL</span>
                  </span>
                </>
              ),
            })}
          </div>
          <nav className="lib-nav" aria-label="Main">
            {groups
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div className="lib-nav-sec" key={g.label}>
                  <div className="lib-nav-group">{g.label}</div>
                  {g.items.map((item) => (
                    <span key={item.id} style={{ display: "contents" }}>
                      {renderLink({
                        href: item.href,
                        className: "lib-nav-item",
                        "aria-current": current(item.id),
                        children: (
                          <>
                            {item.icon && <Icon name={item.icon} />}
                            <span className="lib-nav-label">{item.label}</span>
                          </>
                        ),
                      })}
                    </span>
                  ))}
                </div>
              ))}
          </nav>
        </div>
      </aside>
      <div className="lib-main-col" ref={canvas}>
        <header className="lib-topbar">
          <nav className="lib-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return c.href ? (
                <span key={c.label} style={{ display: "contents" }}>
                  {renderLink({ href: c.href, className: "lib-crumb", children: c.label })}
                </span>
              ) : (
                <span
                  key={c.label}
                  className="lib-crumb"
                  data-last={last ? "" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {c.label}
                </span>
              );
            })}
          </nav>
          <div className="lib-progress" ref={progress} style={{ transform: "scaleX(0)" }} />
        </header>
        <div className="lib-main">{children}</div>
      </div>
      <nav className="lib-tabbar" aria-label="Main">
        {tabs.map((t) => (
          <span key={t.id} style={{ display: "contents" }}>
            {renderLink({
              href: t.href,
              className: "lib-tab",
              "aria-current": current(t.id),
              children: (
                <>
                  <span className="lib-tab-icon">
                    <Icon name={t.icon} size={20} />
                  </span>
                  <span>{t.label}</span>
                </>
              ),
            })}
          </span>
        ))}
      </nav>
    </div>
  );
}

import { useRouteContext, useRouter } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { signOut } from "./api";

/**
 * Settings' Account section (login.md section 4), in the export's markup (SettingsPage.jsx's
 * section, `lib-card cr-sec`, and its secondary Button `av-btn`). The email comes from the session
 * in __root's context. Sign out on 200 goes to /login with replace, where the guard reads no session.
 */
export function AccountSection({ icon }: { icon?: ReactNode }) {
  const router = useRouter();
  const email = useRouteContext({ from: "__root__", select: (c) => c.session?.user.email });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function leave() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const status = await signOut().then(
      (r) => r.status,
      () => 0,
    );
    if (status === 200) {
      await router.navigate({ to: "/login", replace: true });
      return;
    }
    setBusy(false);
    setFailed(true);
  }

  return (
    <section className="lib-card cr-sec" aria-labelledby="set-account">
      <div className="cr-sec-head">
        <h2 className="scr-h2" id="set-account">
          Account
        </h2>
        <p>The operator signed in on this device.</p>
      </div>
      <div className="cr-sec-row">
        <span className="cr-sec-k">Signed in as {email}</span>
        <button
          type="button"
          className="av-btn"
          data-ui="Button"
          data-variant="secondary"
          data-busy={busy ? "true" : undefined}
          aria-disabled={busy ? "true" : undefined}
          onClick={leave}
        >
          {icon}
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
      {failed ? (
        <p className="cr-error" role="alert">
          Couldn't sign out. Try again.
        </p>
      ) : null}
    </section>
  );
}

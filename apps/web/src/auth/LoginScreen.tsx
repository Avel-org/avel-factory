import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { safeNext } from ".";
import { signIn } from "./api";

/** login.md section 3's copy (†: this contract's own). */
const COPY = {
  empty: "Enter your email and password.",
  mismatch: "That email and password don't match.",
  later: "Too many attempts. Try again later.",
  generic: "Couldn't sign in. Check your connection and try again.",
  expired: "Your session ended. Sign in again to continue. Nothing you approved was lost.",
} as const;

type Field = "email" | "password";

interface Problem {
  text: string;
  /** The inputs the alert names: they get aria-invalid and the stopped border. */
  fields: Field[];
}

/** `now` plus the header's seconds, as the operator's local HH:MM. */
function retryTime(seconds: number): string {
  const at = new Date(Date.now() + seconds * 1000);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(at.getHours())}:${two(at.getMinutes())}`;
}

/** The export's StatusGlyph `stopped` (control-room/src/app/logic.js, glyph("stopped", n)). */
function StoppedGlyph({ size }: { size: number }) {
  return (
    <svg
      data-ui="StatusGlyph"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="lg-glyph"
    >
      <rect
        x={size * 0.1}
        y={size * 0.1}
        width={size * 0.8}
        height={size * 0.8}
        rx={size * 0.12}
        fill="var(--av-stopped)"
      />
    </svg>
  );
}

/** The rail head's brand (control-room/src/shell/Sidebar.jsx), as text and not a link. */
function Brand() {
  return (
    <div className="lib-brand lg-brand">
      <span className="lib-brand-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <rect
            x="1.5"
            y="1.5"
            width="15"
            height="15"
            rx="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 12.5 9 5l4 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M6.6 10h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="lib-brand-name">AVEL</span>
    </div>
  );
}

/**
 * /login (login.md section 3). The card is DL's `mh` drawn inline; here it's the export's own
 * equivalents: its tokens, its Button (`av-btn`, data-variant="primary", data-busy) and its
 * StatusGlyph. On a 200 it goes to `next` (safeNext) or `/`; __root's guard reads the new session
 * on that navigation. If it reads none, the guard sends the page back here, and the page says so.
 */
export function LoginScreen({ next, expired }: { next: string | undefined; expired: boolean }) {
  const router = useRouter();
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  // Until the page is hydrated the button is disabled, so a click can't post the form natively.
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    mounted.current = true;
    setReady(true);
    // Email on load; Password when the browser has filled Email in.
    (email.current?.value ? password : email).current?.focus();
    return () => {
      mounted.current = false;
    };
  }, []);

  const fail = (text: string, fields: Field[], focus?: Field) => {
    setProblem({ text, fields });
    if (focus) (focus === "email" ? email : password).current?.focus();
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return; // one request at a time
    const address = email.current?.value ?? "";
    const secret = password.current?.value ?? "";
    if (address.trim() === "" || secret === "") {
      const first: Field = address.trim() === "" ? "email" : "password";
      fail(COPY.empty, [first], first);
      return;
    }
    pending.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const { status, retryAfterSeconds } = await signIn(address, secret);
      if (status === 200) {
        await router.navigate({ href: safeNext(next, window.location.origin) });
        // Back here: the session read after sign-in gave none, or failed.
        if (mounted.current && router.state.location.pathname === "/login") fail(COPY.generic, []);
      } else if (status === 401) {
        if (password.current) password.current.value = "";
        fail(COPY.mismatch, ["email", "password"], "password");
      } else if (status === 429) {
        const text =
          retryAfterSeconds === null
            ? COPY.later
            : `Too many attempts. Try again after ${retryTime(retryAfterSeconds)}.`;
        fail(text, []);
      } else {
        fail(COPY.generic, []);
      }
    } catch {
      fail(COPY.generic, []);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const invalid = (field: Field) => (problem?.fields.includes(field) ? true : undefined);
  const describedBy = (field: Field) => (invalid(field) ? "lg-error" : undefined);

  return (
    <main className="lg-page">
      <div className="lg-card">
        <Brand />
        <h1 className="lg-title">Sign in</h1>
        {expired ? (
          <p className="lg-notice" role="status">
            <StoppedGlyph size={12} />
            <span>
              <b>Signed out</b> {COPY.expired}
            </span>
          </p>
        ) : null}
        <form className="lg-form" method="post" noValidate onSubmit={submit}>
          <label className="lg-field">
            <span>Email</span>
            <input
              ref={email}
              type="email"
              name="email"
              autoComplete="username"
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email")}
            />
          </label>
          <label className="lg-field">
            <span>Password</span>
            <input
              ref={password}
              type="password"
              name="password"
              autoComplete="current-password"
              aria-invalid={invalid("password")}
              aria-describedby={describedBy("password")}
            />
          </label>
          {problem ? (
            <p className="lg-error" id="lg-error" role="alert">
              <StoppedGlyph size={10} />
              <span>{problem.text}</span>
            </p>
          ) : null}
          <div className="lg-foot">
            <button
              type="submit"
              className="av-btn lg-submit"
              data-ui="Button"
              data-variant="primary"
              disabled={!ready}
              data-busy={busy ? "true" : undefined}
              aria-disabled={busy ? "true" : undefined}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

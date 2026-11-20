import { createFileRoute } from "@tanstack/react-router";
import { safeNext } from "@/auth";
import { LoginScreen } from "@/auth/LoginScreen";
import loginCss from "@/auth/login.css?url";
import { appOrigin } from "@/auth/origin";

interface LoginSearch {
  next?: string;
  reason?: "expired";
}

// login.md section 3: outside the control room, drawn on the server, so nothing moves at hydration.
export const Route = createFileRoute("/login")({
  ssr: true,
  // An unsafe next is dropped here, so it never reaches the page or the router's state.
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const next = safeNext(search.next, appOrigin());
    return {
      ...(next === "/" ? {} : { next }),
      ...(search.reason === "expired" ? { reason: "expired" as const } : {}),
    };
  },
  head: () => ({
    meta: [{ title: "Sign in · AVEL" }],
    links: [{ rel: "stylesheet", href: loginCss }],
  }),
  component: Login,
});

function Login() {
  const { next, reason } = Route.useSearch();
  return <LoginScreen next={next} expired={reason === "expired"} />;
}

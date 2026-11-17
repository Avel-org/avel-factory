import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { createClient } from "../data/client";
import { HomeLoading, HomeView } from "../home/HomeView";
import { loadHome } from "../home/load-home";

/** Where /api is: the request's own origin on the server, the page's in the browser. */
const origin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => window.location.origin);

export const Route = createFileRoute("/")({
  loader: () => loadHome(createClient({ baseUrl: origin() })),
  head: () => ({ meta: [{ title: "Decisions · AVEL" }] }),
  pendingComponent: HomeLoading,
  component: Home,
});

function Home() {
  const state = Route.useLoaderData();
  const router = useRouter();
  return <HomeView state={state} onRetry={() => router.invalidate()} />;
}

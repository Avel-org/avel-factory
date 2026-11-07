import { createFileRoute } from "@tanstack/react-router";
import { DecisionsScreen, loadDecisionsScreen } from "../modules/decisions/screens";

// `/`: the approval page (UI contract section 5), rendered on the server with its rows (FM,
// Rendering and SSR). The loader fills route 52's first page into the router's QueryClient with
// the options the screen reads, so the first paint has the data and the browser doesn't fetch
// it again.
export const Route = createFileRoute("/")({
  ssr: true,
  loader: async ({ context }) => {
    try {
      await loadDecisionsScreen(context.queryClient);
    } catch {
      // Not swallowed: a failed first load stays in the query cache as the query's error, and the
      // screen draws it as section 5.4's list states instead of the router's error page.
    }
  },
  component: DecisionsScreen,
});

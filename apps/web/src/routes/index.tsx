import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The export reads window and location.hash from its first line, so it runs on the client only.
// Its stylesheets come with it (control-room/src/main.jsx), so they load at / and nowhere else.
const ControlRoom = lazy(async () => {
  const { ControlRoom } = await import("../../control-room/src/main");
  return { default: ControlRoom };
});

function Skeleton() {
  return (
    <div id="dc-root" role="status" aria-label="Loading the control room">
      <p>Loading the control room</p>
    </div>
  );
}

function Home() {
  return (
    <Suspense fallback={<Skeleton />}>
      <div id="dc-root">
        <ControlRoom />
      </div>
    </Suspense>
  );
}

export const Route = createFileRoute("/")({
  ssr: false,
  pendingComponent: Skeleton,
  component: Home,
});

# Third-party code in the prototype

| What | Where | Version | Licence | Reviewed |
|---|---|---|---|---|
| `thinking-orbs` (npm) | `node_modules`, used by `src/kit/Trail.jsx` (running steps, Canon's presence, the phone dock) | 0.3.2, pinned | MIT | Nov 14: React is its only peer; no network calls, no `eval`; pauses offscreen and under reduced motion |
| Rico UI Blocks, Empty States | Vendored as `src/kit/EmptyArt.jsx`, from `registry/empty-states.tsx` in github.com/ricocc/ricoui-blocks | main, Nov 14 | MIT, Copyright (c) 2026 Ricocc (notice kept in the file header) | Nov 14: pure SVG and CSS; no network, no scripts, no injected HTML; motion only under `prefers-reduced-motion: no-preference` |

Changes to the vendored file:
- TypeScript types removed (the prototype is JSX).
- The light and dark palettes are tinted to Enclosure Grid: a cobalt accent, and graphite at night instead of navy.
- Geometry and motion are unchanged.

In the real app, install the block with `pnpm dlx shadcn@latest add https://blocks.ricoui.com/r/empty-states.json` and apply the same palette through its CSS variables.

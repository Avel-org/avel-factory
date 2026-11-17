import { createHash } from "node:crypto";

/**
 * D5: the dev server's port comes from the worktree, never a fixed 3000. The same checkout
 * always gets the same three ports; another worktree almost always gets different ones.
 */
const seed = createHash("sha256").update(process.cwd()).digest().readUInt16BE(0);
export const MOCK_PORT = 20000 + (seed % 20000);
/** A second dev server with no mock: /api isn't served, so route 52 fails (the error state). */
export const BARE_PORT = MOCK_PORT + 1;
/** The budget spec starts its own `vite preview` here after its own `vite build`. */
export const PREVIEW_PORT = MOCK_PORT + 2;

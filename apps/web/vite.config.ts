import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { type Connect, defineConfig, type Plugin } from "vite";

/**
 * Under AVEL_API=mock the dev server and `vite preview` answer /api with contract-mock's world
 * (the preview so the guard has a session to read there, T-F12-10). `apply: "serve"` and a
 * dynamic import keep the mock out of every production build; without AVEL_API=mock neither
 * server serves /api.
 */
function mockApi(): Plugin {
  return {
    name: "avel-mock-api",
    apply: "serve",
    configureServer: (server) => serveMock(server.middlewares),
    configurePreviewServer: (server) => serveMock(server.middlewares),
  };
}

/** The one /api handler both servers share. */
async function serveMock(middlewares: Connect.Server): Promise<void> {
  if (process.env.AVEL_API !== "mock") return;
  const { createMock } = await import("@avel/contract-mock");
  const { CONTRACT_VERSION } = await import("@avel/contract");
  const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
  middlewares.use("/api", async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
    const method = req.method ?? "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : Buffer.concat(chunks);
    const request = new Request(`http://${req.headers.host}${req.originalUrl}`, {
      method,
      headers,
      body,
    });
    const response = await mock.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [mockApi(), tailwindcss(), tanstackStart(), react()],
});

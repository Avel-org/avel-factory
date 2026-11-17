import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Under AVEL_API=mock the dev server answers /api with contract-mock's world. `apply: "serve"`
 * and a dynamic import keep the mock out of every production build.
 */
function mockApi(): Plugin {
  return {
    name: "avel-mock-api",
    apply: "serve",
    async configureServer(server) {
      if (process.env.AVEL_API !== "mock") return;
      const { createMock } = await import("@avel/contract-mock");
      const { CONTRACT_VERSION } = await import("@avel/contract");
      const mock = createMock({ contractVersion: CONTRACT_VERSION, world: true });
      server.middlewares.use("/api", async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers)) {
          if (value !== undefined)
            headers.set(name, Array.isArray(value) ? value.join(", ") : value);
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
    },
  };
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [mockApi(), tailwindcss(), tanstackStart(), react()],
});

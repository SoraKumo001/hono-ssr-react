import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  ssr: {
    noExternal: process.env.NODE_ENV !== "development" || undefined,
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
    target: "webworker",
  },
  build: {
    rollupOptions: {
      input: ["src/client.tsx"],
      output: {
        entryFileNames: () => {
          return "static/[name].js";
        },
      },
    },
  },
  plugins: [
    react(),
    devServer({
      injectClientScript: false,
      adapter,
      entry: "src/server.tsx",
    }),
  ],
});

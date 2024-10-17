import pages from "@hono/vite-cloudflare-pages";
import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";

export default defineConfig({
  mode: "server",
  build: {
    rollupOptions: {
      input: {
        client: "src/client.tsx",
      },
      output: {
        entryFileNames: () => {
          return "static/[name].js";
        },
      },
    },
  },
  plugins: [
    pages(),
    devServer({
      adapter,
      entry: "src/index.tsx",
    }),
  ],
});

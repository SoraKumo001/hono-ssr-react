import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: {
    noExternal: process.env.NODE_ENV !== "development" || undefined,
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
    target: "webworker",
  },
  build: {
    ssr: true,
    rollupOptions: {
      input: {
        server: "src/index.tsx",
        client: "src/client.tsx",
      },
      output: {
        entryFileNames: ({ name }) => {
          if (name === "client") return "static/[name].js";
          return "[name].js";
        },
      },
    },
  },
  plugins: [
    devServer({
      adapter,
      entry: "src/index.tsx",
    }),
  ],
});

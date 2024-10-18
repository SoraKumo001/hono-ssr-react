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
      input: ["src/server.tsx", "src/client.tsx"],
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
      entry: "src/server.tsx",
    }),
  ],
});

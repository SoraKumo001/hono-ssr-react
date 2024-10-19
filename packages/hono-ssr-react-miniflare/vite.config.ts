import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devServer } from "./vitePlugin";
export default defineConfig({
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
  plugins: [devServer({ entry: "src/server.tsx", bundle: true }), react()],
});

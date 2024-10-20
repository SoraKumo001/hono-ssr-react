import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devServer } from "./vitePlugin";
export default defineConfig({
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
  plugins: [devServer({ entry: "src/server.tsx", bundle: true }), react()],
});

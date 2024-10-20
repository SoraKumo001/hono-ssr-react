import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import {
  Miniflare,
  mergeWorkerOptions,
  MiniflareOptions,
  Response,
} from "miniflare";
import { ViteDevServer } from "vite";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import { unsafeModuleFallbackService } from "./unsafeModuleFallbackService";

async function getTransformedModule(modulePath: string) {
  const result = await build({
    entryPoints: [modulePath],
    bundle: true,
    format: "esm",
    minify: false,
    write: false,
  });
  return result.outputFiles[0].text;
}

async function getTransformedEntry(modulePath: string, baseUrl: string) {
  const result = await build({
    entryPoints: [modulePath],
    format: "esm",
    platform: "browser",
    external: ["*.wasm", "virtual:*"],
    bundle: true,
    minify: false,
    write: false,
    logLevel: "error",
    jsxDev: true,
    banner: {
      js: `import.meta.env={BASE_URL: '${baseUrl}',DEV: true,MODE: 'development',PROD: false, SSR: true};`,
    },
  });
  return result.outputFiles[0].text;
}

export const createMiniflare = async ({
  viteDevServer,
  miniflareOptions,
  bundle,
}: {
  viteDevServer: ViteDevServer;
  miniflareOptions?: MiniflareOptions;
  bundle?: boolean;
}) => {
  const modulePath = path.resolve(__dirname, "miniflare_module.ts");
  const code = await getTransformedModule(modulePath);
  const config = fs.existsSync("wrangler.toml")
    ? unstable_getMiniflareWorkerOptions("wrangler.toml")
    : { workerOptions: {} };

  const _miniflareOptions: MiniflareOptions = {
    compatibilityDate: "2024-08-21",
    cachePersist: ".wrangler",
    modulesRoot: fileURLToPath(new URL("./", import.meta.url)),
    modules: [
      {
        path: modulePath,
        type: "ESModule",
        contents: code,
      },
    ],
    unsafeUseModuleFallbackService: true,
    unsafeModuleFallbackService: (request) =>
      unsafeModuleFallbackService(viteDevServer, request),
    unsafeEvalBinding: "__viteUnsafeEval",
    serviceBindings: {
      __viteFetchModule: async (request) => {
        const args = (await request.json()) as Parameters<
          typeof viteDevServer.environments.ssr.fetchModule
        >;
        if (bundle) {
          const code = await getTransformedEntry(
            args[0],
            viteDevServer.config.base
          );
          const result = await viteDevServer.ssrTransform(code, null, args[0]);
          if (!result) {
            throw new Error("esbuild error");
          }
          return new Response(
            JSON.stringify({
              ...result,
              file: args[0],
              id: args[0],
              url: args[0],
              invalidate: false,
            })
          );
        }

        const result = await viteDevServer.environments.ssr.fetchModule(
          ...args
        );
        return new Response(JSON.stringify(result));
      },
    },
  };
  if (
    "compatibilityDate" in config.workerOptions &&
    !config.workerOptions.compatibilityDate
  ) {
    delete config.workerOptions.compatibilityDate;
  }
  const options = mergeWorkerOptions(
    miniflareOptions
      ? mergeWorkerOptions(_miniflareOptions, miniflareOptions)
      : _miniflareOptions,
    config.workerOptions
  ) as MiniflareOptions;
  const miniflare = new Miniflare(options);
  return miniflare;
};

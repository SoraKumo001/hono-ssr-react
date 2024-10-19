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
import { FetchResult, TransformResult, ViteDevServer } from "vite";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import { unsafeModuleFallbackService } from "./unsafeModuleFallbackService";

async function getTransformedCode(modulePath: string) {
  const result = await build({
    entryPoints: [modulePath],
    bundle: true,
    format: "esm",
    minify: false,
    write: false,
  });
  return result.outputFiles[0].text;
}

export const createMiniflare = async (
  viteDevServer: ViteDevServer,
  bundle: boolean
) => {
  const modulePath = path.resolve(__dirname, "miniflare_module.ts");
  const code = await getTransformedCode(modulePath);
  const config = fs.existsSync("wrangler.toml")
    ? unstable_getMiniflareWorkerOptions("wrangler.toml")
    : { workerOptions: {} };

  const miniflareOption: MiniflareOptions = {
    compatibilityDate: "2024-08-21",
    compatibilityFlags: ["nodejs_compat"],
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
          const output = await build({
            entryPoints: [args[0]],
            format: "esm",
            platform: "browser",
            external: ["*.wasm", "virtual:*"],
            bundle: true,
            minify: false,
            write: false,
            logLevel: "error",
            jsxDev: true,
            banner: {
              js: `import.meta.env={BASE_URL: '${viteDevServer.config.base}',DEV: true,MODE: 'development',PROD: false, SSR: true};`,
            },
          }).catch((e) => {
            console.error("esbuild error", e);
            return e;
          });
          const esModule = output.outputFiles?.[0].text;
          const result = await viteDevServer.ssrTransform(
            esModule,
            null,
            args[0]
          );
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
    miniflareOption,
    config.workerOptions as WorkerOptions
  ) as MiniflareOptions;
  const miniflare = new Miniflare(options);
  return miniflare;
};

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
import { TransformResult, ViteDevServer } from "vite";
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

function createEntryBuilder(viteDevServer: ViteDevServer) {
  let entryCode = "";
  let inputFiles = new Set<string>();
  let isUpdate = true;
  let transform: TransformResult | null = null;
  viteDevServer.watcher.on("change", async (file) => {
    const updatePath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    if (inputFiles.has(updatePath)) {
      isUpdate = true;
    }
  });

  return async (modulePath: string) => {
    if (!isUpdate) {
      return transform;
    }
    const result = await getTransformedEntry(
      modulePath,
      viteDevServer.config.base
    );
    entryCode = result.outputFiles[0].text;
    inputFiles = new Set(Object.keys(result.metafile.inputs));
    isUpdate = false;
    transform = await viteDevServer.ssrTransform(entryCode, null, modulePath);
    return transform;
  };
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
    metafile: true,
    banner: {
      js: `import.meta.env={BASE_URL: '${baseUrl}',DEV: true,MODE: 'development',PROD: false, SSR: true};`,
    },
  });
  return result;
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
  const entryBuilder = createEntryBuilder(viteDevServer);
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
          const result = await entryBuilder(args[0]);
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

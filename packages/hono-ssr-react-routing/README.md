# hono-ssr-react-routing

https://hono-ssr-react-routing.mofon001.workers.dev/

Cloudflare Workers + Hono + Vite + React sample for getting weather forecasts and performing SSR  
Routing is implemented without libraries

# Example

- src/server.tsx

```tsx
import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server.browser";
import { App } from "./App";
import { RouterProvider } from "./RouterProvider";

declare module "react-dom/server.browser" {
  interface ReactDOMServerReadableStream extends ReadableStream {
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
  }
}

type Env = {};

const app = new Hono<Env>();

app.get("*", async (c) => {
  try {
    const url = new URL(c.req.url);
    const stream = await renderToReadableStream(
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <link
            rel="stylesheet"
            href="https://cdn.simplecss.org/simple.min.css"
          />
          {import.meta.env.PROD ? (
            <script type="module" src="/static/client.js"></script>
          ) : (
            <script type="module" src="/src/client.tsx"></script>
          )}
        </head>
        <body>
          <div id="root">
            <RouterProvider pathname={url.pathname}>
              <App />
            </RouterProvider>
          </div>
        </body>
      </html>,
      {
        onError: () => {},
      }
    );
    await stream.allReady;

    if (import.meta.env.DEV) {
      const data = [];
      for await (const chunk of stream) {
        data.push(chunk);
      }
      return c.html(data.map((v) => new TextDecoder().decode(v)).join(""));
    }
    return c.body(stream, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Not found") {
      return c.notFound();
    }
    throw e;
  }
});

export default app;
```

- src/App.tsx

```tsx
import { useSSR } from "next-ssr";
import { useRouter } from "../RouterProvider";

interface Center {
  name: string;
  enName: string;
  officeName?: string;
  children?: string[];
  parent?: string;
  kana?: string;
}
interface Centers {
  [key: string]: Center;
}

const fetchCenters = (): Promise<Centers> =>
  fetch(`https://www.jma.go.jp/bosai/common/const/area.json`)
    .then((r) => r.json())
    .then(
      // Additional weights (500 ms)
      (r) =>
        new Promise((resolve) => setTimeout(() => resolve(r as Centers), 500))
    );

const Page = () => {
  const router = useRouter();
  const { data } = useSSR<Centers>(fetchCenters, { key: "centers" });
  if (!data) return <div>loading</div>;
  return (
    <div>
      {data &&
        Object.entries(data.offices).map(([code, { name }]) => (
          <div key={code}>
            <a
              onClick={(e) => {
                e.preventDefault();
                router.push(`/weather/${code}`);
              }}
              href={`/weather/${code}`}
            >
              {name}
            </a>
          </div>
        ))}
    </div>
  );
};
export default Page;
```

- src/pages/weather.tsx

```tsx
import { useSSR } from "next-ssr";
import { useRouter } from "../RouterProvider";

export interface WeatherType {
  publishingOffice: string;
  reportDatetime: string;
  targetArea: string;
  headlineText: string;
  text: string;
}

/**
 * Data obtained from the JMA website.
 */
const fetchWeather = (id: number): Promise<WeatherType> =>
  fetch(
    `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${id}.json`
  )
    .then((r) => r.json())
    .then(
      // Additional weights (500 ms)
      (r) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(r as WeatherType), 500)
        )
    );

/**
 * Components for displaying weather information
 */

const Page = ({ code }: { code: number }) => {
  const router = useRouter();
  const { data, reload, isLoading } = useSSR<WeatherType>(
    () => fetchWeather(code),
    { key: code }
  );
  if (!data) return <div>loading</div>;
  const { targetArea, reportDatetime, headlineText, text } = data;
  return (
    <div
      style={
        isLoading ? { background: "gray", position: "relative" } : undefined
      }
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            color: "white",
            top: "50%",
            left: "50%",
          }}
        >
          loading
        </div>
      )}
      <a
        href=".."
        onClick={(e) => {
          e.preventDefault();
          router.push("..");
        }}
      >
        ⏪️Home
      </a>
      <h1>{targetArea}</h1>
      <button onClick={reload}>Reload</button>
      <div>
        {new Date(reportDatetime).toLocaleString("ja-JP", {
          timeZone: "JST",
        })}
      </div>
      <div>{headlineText}</div>
      <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
};

export default Page;
```

- vite.config.ts

```ts
import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: {
    noExternal: process.env.NODE_ENV !== "development" ? true : undefined,
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
```

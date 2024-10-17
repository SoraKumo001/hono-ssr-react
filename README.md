# hono-ssr-react

https://hono-ssr-react.pages.dev/

# Example

- src/index.tsx

```tsx
import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server.browser";
import { App } from "./App";

declare module "react-dom/server.browser" {
  interface ReactDOMServerReadableStream extends ReadableStream {
    [Symbol.asyncIterator](): AsyncIterableIterator<any>;
  }
}

type Env = {};

const app = new Hono<Env>();

app.get("*", async (c) => {
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
          <App />
        </div>
      </body>
    </html>
  );
  await stream.allReady;

  if (import.meta.env.DEV) {
    const data = [];
    for await (const chunk of stream) {
      data.push(chunk);
    }
    return c.html(data.map((v) => new TextDecoder().decode(v)).join(""));
  }
  return c.newResponse(stream, {
    headers: {
      "Content-Type": "text/html",
    },
  });
});

export default app;
```

- src/App.tsx

```tsx
import { SSRProvider } from "next-ssr";
import Page from "./page";

export function App() {
  return (
    <SSRProvider>
      <Page />
    </SSRProvider>
  );
}
```

- src/page/index.tsx

```tsx
import { useSSR } from "next-ssr";

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
const Weather = ({ code }: { code: number }) => {
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

/**
 * Page display components
 */

const Page = () => {
  return (
    <>
      {/* Chiba  */}
      <Weather code={120000} />
      {/* Tokyo */}
      <Weather code={130000} />
      {/* Kanagawa */}
      <Weather code={140000} />
    </>
  );
};
export default Page;
```

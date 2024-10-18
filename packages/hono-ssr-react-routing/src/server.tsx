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

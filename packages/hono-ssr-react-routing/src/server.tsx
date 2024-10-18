import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server.browser";
import { App } from "./App";
import { RouterProvider } from "./RouterProvider";

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
          {import.meta.env.DEV && (
            <>
              <script
                type="module"
                dangerouslySetInnerHTML={{
                  __html: `
            import RefreshRuntime from "/@react-refresh"
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true`,
                }}
              />
              <script type="module" src="/@vite/client" />
            </>
          )}
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

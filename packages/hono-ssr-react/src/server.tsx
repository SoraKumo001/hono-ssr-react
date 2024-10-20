import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server.browser";
import { App } from "./App";

type Env = {};

const app = new Hono<Env>();

app.get("*", async (c) => {
  const stream = await renderToReadableStream(
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        {import.meta.env?.DEV && (
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
        {import.meta.env?.DEV ? (
          <script type="module" src="/src/client.tsx"></script>
        ) : (
          <script type="module" src="/static/client.js"></script>
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

  return c.body(stream, {
    headers: {
      "Content-Type": "text/html",
    },
  });
});

export default app;

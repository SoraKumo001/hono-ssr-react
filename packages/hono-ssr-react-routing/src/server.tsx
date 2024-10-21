import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server.browser";
import { App } from "./Components/App";
import { RouterProvider } from "./Components/RouterProvider";
import { Html } from "./Components/Html";

type Env = {};

const app = new Hono<Env>();

app.get("*", async (c) => {
  try {
    const stream = await renderToReadableStream(
      <Html url={c.req.url}>
        <App />
      </Html>,
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

import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server";
import { App } from "./Components/App";
import { Html } from "./Components/Html";

type Env = {};

const app = new Hono<Env>();

const getValue = async () => {
  const cache = await caches.open("hono-ssr-react-miniflare");
  const url = new URL("https://localhost/value");

  const cachedResponse = await cache.match(url);
  const value = cachedResponse ? parseInt(await cachedResponse.text()) : 0;
  await cache.put(
    url,
    new Response((value + 1).toString(), {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "max-age=31536000",
      },
    })
  );
  return value;
};

app.get("/count", async (c) => {
  const count = await getValue();
  return c.json({ count });
});

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

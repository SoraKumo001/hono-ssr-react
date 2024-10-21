import { Hono } from "hono";
import { renderToReadableStream } from "react-dom/server";
import { App } from "./Components/App";
import { Html } from "./Components/Html";

type Env = {
  Bindings?: object;
  Variables?: object;
  self: Fetcher;
  __miniflare?: boolean;
};

const app = new Hono<Env>();

app.get("/count", async (c) => {
  const cache = await caches.open("hono-ssr-react-miniflare");
  const url = new URL("https://localhost/value");

  const cachedResponse = await cache.match(url);
  const count = cachedResponse ? parseInt(await cachedResponse.text()) : 0;
  await cache.put(
    url,
    new Response((count + 1).toString(), {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "max-age=31536000",
      },
    })
  );
  return c.json({ count });
});

app.get("*", async (c) => {
  const env = c.env as Env;
  try {
    const stream = await renderToReadableStream(
      <Html
        url={c.req.url}
        host={c.req.header("x-forwarded-host") ?? c.req.header("host")}
        protocol={c.req.header("x-forwarded-proto")?.toString().split(",")[0]}
        self={env.__miniflare ? undefined : env.self.fetch.bind(env.self)}
        requestInit={c.req.raw}
      >
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

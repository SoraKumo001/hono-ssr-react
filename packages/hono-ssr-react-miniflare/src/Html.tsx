import { ReactNode } from "react";
import { RouterProvider } from "./RouterProvider";

export const Html = ({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) => {
  const _url = new URL(url);
  return (
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
          <RouterProvider pathname={_url.pathname}>{children}</RouterProvider>
        </div>
      </body>
    </html>
  );
};

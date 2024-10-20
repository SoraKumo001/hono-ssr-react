import { ReactNode } from "react";
import { RouterProvider } from "./RouterProvider";
import { RootProvider, RootValue } from "remix-provider";
export const Html = ({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) => {
  const _url = new URL(url);
  return (
    <RootProvider>
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
          <RootValue />
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
            <RouterProvider pathname={_url.pathname}>{children}</RouterProvider>
          </div>
        </body>
      </html>
    </RootProvider>
  );
};

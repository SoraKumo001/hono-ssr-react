import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { RouterProvider } from "./RouterProvider";

const rootElement = document.getElementById("root")!;
const url = new URL(location.href);
hydrateRoot(
  rootElement,
  <RouterProvider pathname={url.pathname}>
    <App />
  </RouterProvider>
);

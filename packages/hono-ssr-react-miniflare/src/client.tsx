import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { RouterProvider } from "./RouterProvider";
import { Html } from "./Html";

const rootElement = document.getElementById("root")!;
hydrateRoot(
  document,
  <Html url={location.href}>
    <App />
  </Html>
);

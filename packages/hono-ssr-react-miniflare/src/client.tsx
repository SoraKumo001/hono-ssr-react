import { hydrateRoot } from "react-dom/client";
import { App } from "./Components/App";
import { RouterProvider } from "./Components/RouterProvider";
import { Html } from "./Components/Html";

const rootElement = document.getElementById("root")!;
hydrateRoot(
  document,
  <Html url={location.href}>
    <App />
  </Html>
);

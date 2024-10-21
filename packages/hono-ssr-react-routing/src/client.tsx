import { hydrateRoot } from "react-dom/client";
import { App } from "./Components/App";
import { Html } from "./Components/Html";

hydrateRoot(
  document,
  <Html url={location.href}>
    <App />
  </Html>
);

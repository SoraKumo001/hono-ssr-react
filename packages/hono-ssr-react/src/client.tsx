import { hydrateRoot } from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root")!;
hydrateRoot(rootElement, <App />);

import { SSRProvider } from "next-ssr";
import Page from "./page";

export function App() {
  return (
    <SSRProvider>
      <Page />
    </SSRProvider>
  );
}

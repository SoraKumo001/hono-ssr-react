import { SSRProvider } from "next-ssr";
import Home from "./pages";
import Weather from "./pages/weather";
import { useRouter } from "./RouterProvider";

export function App() {
  const router = useRouter();
  const paths = router.pathname.slice(1).split(/\//);

  const page =
    paths.length === 1 && paths[0] === "" ? (
      <Home />
    ) : paths.length === 2 && paths[0] === "weather" ? (
      <Weather code={Number(paths[1])} />
    ) : undefined;
  if (!page) throw new Error("Not found");

  return <SSRProvider>{page}</SSRProvider>;
}

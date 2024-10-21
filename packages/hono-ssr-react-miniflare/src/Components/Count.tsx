import { useSSR } from "next-ssr";
import { useRouter } from "./RouterProvider";

export const Count = () => {
  const router = useRouter();
  const { data, reload } = useSSR<{ count: string }>(
    () => {
      return router
        .fetch(`${router.url.origin}/count`, router.requestInit)
        .then(async (res) => res.json());
    },
    { key: "count" }
  );
  if (!data) return null;
  return <div onClick={reload}>Test of Cache API: {data.count}</div>;
};

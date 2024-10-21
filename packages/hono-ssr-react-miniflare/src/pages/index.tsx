import { useSSR } from "next-ssr";
import { useRouter } from "../Components/RouterProvider";

interface Center {
  name: string;
  enName: string;
  officeName?: string;
  children?: string[];
  parent?: string;
  kana?: string;
}
interface Centers {
  [key: string]: Center;
}

const fetchCenters = (): Promise<Centers> =>
  fetch(`https://www.jma.go.jp/bosai/common/const/area.json`)
    .then((r) => r.json())
    .then(
      // Additional weights (0 ms)
      (r) =>
        new Promise((resolve) => setTimeout(() => resolve(r as Centers), 0))
    );

const Page = () => {
  const router = useRouter();
  const { data } = useSSR<Centers>(fetchCenters, { key: "centers" });
  if (!data) return <div>loading</div>;
  return (
    <div>
      {data &&
        Object.entries(data.offices).map(([code, { name }]) => (
          <div key={code}>
            <a
              onClick={(e) => {
                e.preventDefault();
                router.push(`/weather/${code}`);
              }}
              href={`/weather/${code}`}
            >
              {name}
            </a>
          </div>
        ))}
    </div>
  );
};
export default Page;

import { useSSR } from "next-ssr";
import { useRouter } from "../RouterProvider";

export interface WeatherType {
  publishingOffice: string;
  reportDatetime: string;
  targetArea: string;
  headlineText: string;
  text: string;
}

/**
 * Data obtained from the JMA website.
 */
const fetchWeather = (id: number): Promise<WeatherType> =>
  fetch(
    `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${id}.json`
  )
    .then((r) => r.json())
    .then(
      // Additional weights (0 ms)
      (r) =>
        new Promise((resolve) => setTimeout(() => resolve(r as WeatherType), 0))
    );

/**
 * Components for displaying weather information
 */

const Page = ({ code }: { code: number }) => {
  const router = useRouter();
  const { data, reload, isLoading } = useSSR<WeatherType>(
    () => fetchWeather(code),
    { key: code }
  );
  if (!data) return <div>loading</div>;
  const { targetArea, reportDatetime, headlineText, text } = data;
  return (
    <div
      style={
        isLoading ? { background: "gray", position: "relative" } : undefined
      }
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            color: "white",
            top: "50%",
            left: "50%",
          }}
        >
          loading
        </div>
      )}
      <a
        href=".."
        onClick={(e) => {
          e.preventDefault();
          router.push("..");
        }}
      >
        ⏪️Home
      </a>
      <h1>{targetArea}</h1>
      <button onClick={reload}>Reload</button>
      <div>
        {new Date(reportDatetime).toLocaleString("ja-JP", {
          timeZone: "JST",
        })}
      </div>
      <div>{headlineText}</div>
      <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
};

export default Page;

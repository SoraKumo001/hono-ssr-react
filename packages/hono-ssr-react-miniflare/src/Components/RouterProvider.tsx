import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type RouterContext = {
  url: URL;
  requestInit?: RequestInit;
  fetch: Fetcher["fetch"];
  push: (pathname: string) => void;
};

const context = createContext<RouterContext>(undefined as never);
export const RouterProvider = ({
  children,
  url,
  host,
  protocol,
  fetch,
  requestInit,
}: {
  children: ReactNode;
  url: string;
  host?: string;
  protocol?: string;
  fetch?: Fetcher["fetch"];
  requestInit?: RequestInit;
}) => {
  const [_url, setUrl] = useState(url);
  useEffect(() => {
    const listener = () => {
      setUrl(window.location.href);
    };
    addEventListener("popstate", listener);
    return () => {
      removeEventListener("popstate", listener);
    };
  });
  const push = useCallback((pathname: string) => {
    const url = new URL(pathname, window.location.href);
    history.pushState({}, "", url.pathname);
    setUrl(url.href);
  }, []);
  const value = useMemo(() => {
    const url = new URL(_url);
    if (host) url.host = host;
    if (protocol) url.protocol = protocol;
    return {
      url,
      push,
      requestInit,
      fetch: fetch ?? globalThis.fetch.bind(globalThis),
    };
  }, [_url, push, requestInit, fetch]);
  return <context.Provider value={value}>{children}</context.Provider>;
};
export const useRouter = () => {
  return useContext(context);
};

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
  push: (pathname: string) => void;
};

const context = createContext<RouterContext>(undefined as never);
export const RouterProvider = ({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
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
    return { url, push };
  }, [_url, push]);
  return <context.Provider value={value}>{children}</context.Provider>;
};
export const useRouter = () => {
  return useContext(context);
};

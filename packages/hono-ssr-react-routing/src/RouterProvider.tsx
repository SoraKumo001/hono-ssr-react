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
  pathname: string;
  push: (pathname: string) => void;
};

const context = createContext<RouterContext>(undefined as never);
export const RouterProvider = ({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) => {
  const [_pathname, setPathName] = useState(pathname);
  useEffect(() => {
    const listener = () => {
      setPathName(window.location.pathname);
    };
    addEventListener("popstate", listener);
    return () => {
      removeEventListener("popstate", listener);
    };
  });
  const push = useCallback((pathname: string) => {
    const url = new URL(pathname, window.location.href);
    history.pushState({}, "", url.pathname);
    setPathName(url.pathname);
  }, []);
  const value = useMemo(() => {
    return { pathname: _pathname, push };
  }, [_pathname, push]);
  return <context.Provider value={value}>{children}</context.Provider>;
};
export const useRouter = () => {
  return useContext(context);
};

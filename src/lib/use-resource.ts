"use client";
import { useEffect, useState } from "react";
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setState({ data: null, loading: true, error: null });
        return loader(controller.signal);
      })
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setState({ data: null, loading: false, error });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [loader, attempt]);
  return { ...state, retry: () => setAttempt((a) => a + 1) };
}

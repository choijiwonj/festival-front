"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { accountApi, type Session, type User } from "@/lib/api/account";
import { AUTH_EXPIRED_EVENT } from "@/lib/api/client";

export type AuthState = {
  session: Session | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  setUser: (user: User) => void;
  clear: () => void;
  signIn: (session: Session) => void;
};
export const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const sequence = useRef(0);
  const resolved = useRef(false);
  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  const clear = useCallback(() => {
    resolved.current = true;
    sequence.current++;
    setSession({ user: null, csrfToken: null });
    setError(null);
    setLoading(false);
  }, []);
  const setUser = useCallback((user: User) => {
    resolved.current = true;
    sequence.current++;
    setSession((s) => (s ? { ...s, user } : s));
    setLoading(false);
  }, []);
  const signIn = useCallback((value: Session) => {
    resolved.current = true;
    sequence.current++;
    setSession(value);
    setError(null);
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const current = ++sequence.current;
    setLoading(!resolved.current);
    setError(null);
    accountApi.session(controller.signal).then(
      (r) => {
        if (active && sequence.current === current) {
          resolved.current = true;
          setSession(r.data);
          setLoading(false);
        }
      },
      (e) => {
        if (active && sequence.current === current && e.name !== "AbortError") {
          resolved.current = true;
          setSession(null);
          setError(e);
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);
  useEffect(() => {
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, clear);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, clear);
  }, [clear]);
  return (
    <AuthContext.Provider
      value={{ session, loading, error, reload, setUser, clear, signIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}

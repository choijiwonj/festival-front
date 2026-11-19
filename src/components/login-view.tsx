"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { UserRound, Eye, EyeOff } from "lucide-react";
import { accountApi } from "@/lib/api/account";
import { useAuth } from "./auth-provider";
import { safeReturnTo } from "@/lib/navigation";
import { Loading } from "./ui";
export function LoginView() {
  const params = useSearchParams(),
    router = useRouter();
  const { session, loading, error, reload, signIn } = useAuth();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    if (!loading && session?.user) router.replace(returnTo);
  }, [loading, session, returnTo, router]);
  async function login(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    if (!username.trim() || !password) {
      setMessage("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await accountApi.login(username, password);
      if (!response.data.user || !response.data.csrfToken)
        throw new Error("로그인 결과를 확인하지 못했어요. 다시 시도해 주세요.");
      setPassword("");
      signIn(response.data);
      router.replace(returnTo);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (loading || session?.user) return <Loading />;
  return (
    <section className="login-prompt login-card">
      <span className="account-avatar">
        <UserRound size={30} />
      </span>
      <p className="eyebrow">나만의 작은 여행</p>
      <h1>여행을 모아두세요</h1>
      <p>
        아이디로 로그인하고
        <br />
        저장된 계획과 나의 여행 기록을 만나보세요.
      </p>
      <form className="login-form" onSubmit={login}>
        <label htmlFor="login-username">
          아이디
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={50}
            value={username}
            disabled={busy}
            placeholder="아이디를 입력해 주세요"
            onChange={(e) => {
              setUsername(e.target.value);
              setMessage("");
            }}
          />
        </label>
        <label htmlFor="login-password">
          비밀번호
          <span className="password-input">
            <input
              id="login-password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              disabled={busy}
              placeholder="비밀번호를 입력해 주세요"
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
              }}
            />
            <button
              type="button"
              className="password-visibility"
              aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
              aria-pressed={visible}
              disabled={busy}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
        </label>
        {message && (
          <p role="alert" className="field-error">
            {message}
          </p>
        )}
        <button type="submit" className="button" disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
      {error && (
        <div className="login-session-error">
          <p role="alert">로그인 상태를 확인하지 못했어요.</p>
          <button
            className="text-link"
            type="button"
            disabled={busy}
            onClick={reload}
          >
            상태 다시 확인
          </button>
        </div>
      )}
      <div className="login-divider">
        <span>다른 로그인 방법</span>
      </div>
      <a
        className={`button secondary${busy ? " unavailable" : ""}`}
        aria-disabled={busy || undefined}
        tabIndex={busy ? -1 : undefined}
        onClick={(e) => {
          if (busy) e.preventDefault();
        }}
        href={`/auth/start?returnTo=${encodeURIComponent(returnTo)}`}
      >
        카카오로 로그인
      </a>
      {params.get("error") === "provider_unavailable" && (
        <p role="alert" className="field-error">
          현재 카카오 로그인에 연결할 수 없어요. 아이디·비밀번호로 로그인해
          주세요.
        </p>
      )}
      <p className="muted">로그인 후 선택한 화면으로 돌아옵니다.</p>
    </section>
  );
}

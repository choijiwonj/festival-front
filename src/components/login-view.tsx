"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRound } from "lucide-react";
import { useAuth } from "./auth-provider";
import { providerLoginUrl } from "@/lib/api/account";
import { safeReturnTo } from "@/lib/navigation";
import { Loading, ErrorState } from "./ui";
export function LoginView() {
  const params = useSearchParams();
  const router = useRouter();
  const { session, loading, error, reload } = useAuth();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const isDev = process.env.NEXT_PUBLIC_LOGIN_PROVIDER === "dev";
  useEffect(() => {
    if (!loading && session?.user) router.replace(returnTo);
  }, [loading, session, returnTo, router]);
  if (loading || session?.user) return <Loading />;
  return (
    <section className="login-prompt">
      <span className="account-avatar">
        <UserRound size={30} />
      </span>
      <p className="eyebrow">나만의 작은 여행</p>
      <h1>여행을 모아두세요</h1>
      <p>
        로그인하면 저장된 계획과
        <br />
        내가 남긴 후기를 다시 만날 수 있어요.
      </p>
      {error ? (
        <ErrorState
          message="로그인 서비스에 연결하지 못했어요."
          retry={reload}
        />
      ) : (
        <a className="button" href={providerLoginUrl(returnTo)}>
          {isDev ? "개발용 계정으로 로그인" : "카카오로 로그인"}
        </a>
      )}
      <p className="muted">
        {isDev
          ? "개발 서버의 테스트 로그인입니다."
          : "로그인 후 선택한 화면으로 돌아옵니다."}
      </p>
    </section>
  );
}

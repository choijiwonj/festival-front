"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Loading, ErrorState } from "./ui";
import { loginPageUrl } from "@/lib/navigation";

export function LoginPrompt({
  returnTo,
  title = "로그인이 필요한 공간이에요",
  message = "저장된 계획과 내 후기는 로그인 후에만 확인할 수 있어요.",
}: {
  returnTo: string;
  title?: string;
  message?: string;
}) {
  return (
    <section className="login-prompt">
      <span className="account-avatar">
        <LockKeyhole size={26} />
      </span>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link href={loginPageUrl(returnTo)} className="button">
        로그인하고 계속하기
      </Link>
      <Link href="/my" className="text-link">
        마이페이지로
      </Link>
    </section>
  );
}
export function RequireAuth({
  children,
  returnTo,
  message,
}: {
  children: React.ReactNode;
  returnTo?: string;
  message?: string;
}) {
  const { session, loading, error, reload } = useAuth();
  const path = usePathname();
  if (loading) return <Loading />;
  if (error)
    return (
      <ErrorState
        message="로그인 상태를 확인하지 못했어요. 다시 시도해 주세요."
        retry={reload}
      />
    );
  if (!session?.user)
    return <LoginPrompt returnTo={returnTo ?? path} message={message} />;
  return <>{children}</>;
}

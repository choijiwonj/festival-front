"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "./require-auth";
import { useAuth } from "./auth-provider";
import { accountApi } from "@/lib/api/account";
import { Notice } from "./ui";
export function AccountSettings() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
function AccountContent() {
  const { session, clear } = useAuth();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await accountApi.logout(session?.csrfToken ?? null);
      clear();
      router.replace("/my");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "로그아웃하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">내 계정 관리</h1>
      <div className="info-card mb-4">
        <p className="muted">닉네임</p>
        <p className="font-bold mt-1">{session!.user!.nickname}</p>
        <Link className="text-link" href="/my">
          마이페이지에서 수정
        </Link>
      </div>
      <Notice>
        프로필 정보는 마이페이지에서, 기본 출발지와 여행 취향은 여행 기본
        설정에서 관리할 수 있어요.
      </Notice>
      <Link href="/my/settings/travel" className="text-link mt-3">
        여행 기본 설정
      </Link>
      <div className="mt-6">
        {confirm ? (
          <section
            className="account-confirm"
            role="alertdialog"
            aria-labelledby="logout-title"
          >
            <h2 id="logout-title">로그아웃하시겠어요?</h2>
            <p>저장된 여행 계획은 유지돼요.</p>
            <div className="flex gap-2 mt-4">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => {
                  setConfirm(false);
                  setError("");
                }}
              >
                취소
              </button>
              <button className="button" disabled={busy} onClick={logout}>
                {busy ? "로그아웃 중…" : "로그아웃"}
              </button>
            </div>
          </section>
        ) : (
          <button className="button secondary" onClick={() => setConfirm(true)}>
            로그아웃
          </button>
        )}
        {error && (
          <p role="alert" className="field-error mt-3">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  UserRound,
  LockKeyhole,
  Bookmark,
  NotebookPen,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { Loading, ErrorState } from "./ui";
import { accountApi, nicknameError } from "@/lib/api/account";
import { loginPageUrl } from "@/lib/navigation";
import { ActiveRequests } from "./active-requests";

export function MyDashboard({
  loginFailed = false,
}: {
  loginFailed?: boolean;
}) {
  const { session, loading, error, reload, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const user = session?.user;
  async function save(e: FormEvent) {
    e.preventDefault();
    const issue = nicknameError(nickname);
    if (issue) {
      setMessage(issue);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await accountApi.updateNickname(
        nickname.trim(),
        session?.csrfToken ?? null,
      );
      setUser(response.data);
      setEditing(false);
      setMessage("닉네임을 변경했어요.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "변경하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">나의 여행 보관함</h1>
      {loginFailed && (
        <p className="field-error mb-4" role="alert">
          로그인하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState
          message="로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요."
          retry={reload}
        />
      ) : (
        <section className="account-profile" aria-label="내 프로필">
          <span className="account-avatar">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                width={48}
                height={48}
                alt="내 프로필 사진"
                unoptimized
              />
            ) : (
              <UserRound size={27} strokeWidth={1.6} />
            )}
          </span>
          <div className="account-profile-info">
            <h2>
              {user ? `${user.nickname} 님` : "로그인하고 여행을 모아보세요"}
            </h2>
            <p>
              {user
                ? "나의 여행 기록을 한곳에서 만나보세요."
                : "저장된 계획과 내 후기는 로그인 후 확인할 수 있어요."}
            </p>
            {user ? (
              <button
                className="profile-edit"
                onClick={() => {
                  setNickname(user.nickname);
                  setMessage("");
                  setEditing(!editing);
                }}
                aria-expanded={editing}
              >
                <Pencil size={12} /> 닉네임 수정
              </button>
            ) : (
              <Link href={loginPageUrl("/my")} className="text-link">
                로그인하기 <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </section>
      )}
      {user && editing && (
        <form className="filter-panel mt-4" onSubmit={save}>
          <label htmlFor="nickname">
            닉네임
            <input
              id="nickname"
              autoComplete="nickname"
              value={nickname}
              minLength={2}
              maxLength={20}
              required
              disabled={busy}
              onChange={(e) => {
                setNickname(e.target.value);
                setMessage("");
              }}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              className="button secondary"
              onClick={() => {
                setEditing(false);
                setMessage("");
              }}
            >
              취소
            </button>
            <button type="submit" disabled={busy} className="button">
              {busy ? "변경 중…" : "변경사항 저장"}
            </button>
          </div>
        </form>
      )}
      {message && (
        <p className="account-feedback" role="status">
          {message}
        </p>
      )}
      <section className="section account-library">
        <h2>나의 여행 기록</h2>
        <div className="my-menu">
          {[
            {
              path: "/my/plans",
              title: "저장된 계획",
              description: "추천받은 여행을 다시 꺼내보세요",
              icon: Bookmark,
            },
            {
              path: "/my/reviews",
              title: "내 후기",
              description: "내가 남긴 여행 이야기를 모아보세요",
              icon: NotebookPen,
            },
          ].map(({ path, title, description, icon: Icon }) =>
            loading || error ? (
              <div
                key={path}
                className="account-menu-row unavailable"
                aria-disabled="true"
              >
                <Icon size={21} />
                <div>
                  <h3>{title}</h3>
                  <p>로그인 상태 확인 후 이용할 수 있어요</p>
                </div>
                <LockKeyhole size={16} />
              </div>
            ) : (
              <Link
                key={path}
                href={user ? path : loginPageUrl(path)}
                className="account-menu-row"
              >
                <Icon size={21} />
                <div>
                  <h3>{title}</h3>
                  <p>{user ? description : "로그인 후 이용할 수 있어요"}</p>
                </div>
                {user ? <ChevronRight size={17} /> : <LockKeyhole size={16} />}
              </Link>
            ),
          )}
        </div>
      </section>
      {user && !loading && !error && <ActiveRequests />}
      <Link href="/festivals" className="button mt-6">
        새로운 축제 찾아보기
      </Link>
    </>
  );
}

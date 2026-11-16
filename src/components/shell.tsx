"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  NotebookText,
  UserRound,
  ArrowLeft,
} from "lucide-react";
import { isMock } from "@/lib/repository";
const links = [
  { href: "/", label: "홈", icon: Home },
  { href: "/map", label: "지도", icon: Map },
  { href: "/board", label: "게시판", icon: NotebookText },
  { href: "/my", label: "마이페이지", icon: UserRound },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = path.startsWith("/my")
    ? "/my"
    : path.startsWith("/map")
      ? "/map"
      : path.startsWith("/board")
        ? "/board"
        : "/";
  const title =
    path === "/festivals"
      ? "전체 축제"
      : path.startsWith("/festivals/")
        ? "축제 상세"
        : path.startsWith("/trip")
          ? "여행 준비"
          : links.find((l) => l.href === active)?.label;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <header className="app-header">
        <Link href="/" className="font-bold text-[19px]">
          {path === "/" ? "축제잇길" : title}
        </Link>
        {path !== "/" && (
          <Link
            href={
              path.startsWith("/my/")
                ? "/my"
                : path.startsWith("/festivals/")
                  ? "/festivals"
                  : "/"
            }
            aria-label="이전 목록으로"
            className="icon-button"
          >
            <ArrowLeft size={22} />
          </Link>
        )}
      </header>
      <main id="main" className="page-content" tabIndex={-1}>
        {children}
        <p className="mode-note">
          {isMock
            ? "목 데이터 시연 · 실제 축제 일정이 아닙니다."
            : "API 연결 모드 · 서버에서 제공한 정보입니다."}
        </p>
      </main>
      <nav aria-label="주 메뉴" className="bottom-nav">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active === href ? "page" : undefined}
            className={active === href ? "nav-item active" : "nav-item"}
          >
            <Icon size={21} strokeWidth={1.6} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

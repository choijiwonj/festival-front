"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  NotebookText,
  UserRound,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { getHeader } from "@/lib/navigation";
const links = [
  { href: "/", label: "홈", icon: Home },
  { href: "/map", label: "지도", icon: Map },
  { href: "/board", label: "게시판", icon: NotebookText },
  { href: "/my", label: "마이페이지", icon: UserRound },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { active, title, backHref, showSettings } = getHeader(path);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        본문 바로가기
      </a>
      <header className="app-header">
        <p className="font-bold text-[19px]">{title}</p>
        {showSettings ? (
          <Link href="/my/settings" aria-label="설정" className="icon-button">
            <Settings size={22} strokeWidth={1.7} />
          </Link>
        ) : (
          backHref && (
            <Link href={backHref} aria-label="뒤로가기" className="icon-button">
              <ArrowLeft size={22} />
            </Link>
          )
        )}
      </header>
      <main id="main" className="page-content" tabIndex={-1}>
        {children}
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

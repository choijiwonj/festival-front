import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Notice } from "@/components/ui";
export default function Page() {
  return (
    <>
      <h1 className="page-title">나에게 맞는 여행 준비</h1>
      <Notice>
        <p>
          자주 쓰는 조건을 저장해 두면
          <br />
          다음 여행을 더 편하게 시작할 수 있어요.
        </p>
      </Notice>
      <div className="my-menu">
        {[
          {
            href: "/my/settings/travel",
            title: "여행 기본 설정",
            description: "출발지 · 교통수단 · 인원 · 취향",
          },
          {
            href: "/my/settings/account",
            title: "계정 및 개인정보 관리",
            description: "프로필 · 기본 출발지 저장 · 로그아웃",
          },
          {
            href: "/my/settings/service",
            title: "서비스 안내",
            description: "공지사항 · 문의 · 약관 · 정보 출처",
          },
        ].map((item) => (
          <Link key={item.href} className="festival-row" href={item.href}>
            <div>
              <h2 className="text-sm">{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <ChevronRight size={16} />
          </Link>
        ))}
      </div>
      <h2 className="settings-future-title">앞으로 추가될 기능</h2>
      <div className="festival-row unavailable" aria-disabled="true">
        <div>
          <h3>알림 설정 · 준비 중</h3>
          <p>계획 생성 완료 · 축제 변경 · 댓글 알림</p>
        </div>
      </div>
    </>
  );
}

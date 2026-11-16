export const rootTabs = ["/", "/map", "/board", "/my"] as const;

export function getHeader(path: string) {
  const active = path.startsWith("/my")
    ? "/my"
    : path.startsWith("/map")
      ? "/map"
      : path.startsWith("/board")
        ? "/board"
        : "/";
  const titles: Record<string, string> = {
    "/": "축제잇길",
    "/map": "지도",
    "/board": "게시판",
    "/my": "마이페이지",
    "/my/settings": "설정",
    "/my/settings/travel": "여행 기본 설정",
    "/my/settings/account": "계정 및 개인정보",
    "/my/settings/service": "서비스 안내",
    "/my/plans": "저장된 계획",
    "/my/reviews": "내 후기",
    "/login": "로그인",
    "/festivals": "전체 축제",
    "/trip": "여행 준비",
  };
  const title =
    titles[path] ??
    (path.startsWith("/my/plans/")
      ? "여행 계획"
      : path.startsWith("/festivals/")
        ? "축제 상세"
        : "축제잇길");
  const backHref = rootTabs.some((tab) => tab === path)
    ? null
    : path.startsWith("/my/settings/")
      ? "/my/settings"
      : path.startsWith("/my/plans/")
        ? "/my/plans"
        : path.startsWith("/my/") || path === "/login"
          ? "/my"
          : path.startsWith("/festivals/")
            ? "/festivals"
            : "/";
  return { title, active, backHref, showSettings: path === "/my" };
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/my";
  // 여러 번 인코딩한 외부 경로·역슬래시·제어문자도 허용하지 않습니다.
  let decoded = value;
  try {
    for (let i = 0; i < 3; i++) {
      if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded))
        return "/my";
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return "/my";
  }
  if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded))
    return "/my";
  return value.startsWith("/login") ? "/my" : value;
}

export function loginPageUrl(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

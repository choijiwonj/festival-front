import { NextRequest, NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/navigation";
// Keep OAuth cookies on the frontend origin and show a useful screen for 503s.
export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const fail = () =>
    NextResponse.redirect(
      new URL(
        `/login?returnTo=${encodeURIComponent(returnTo)}&error=provider_unavailable`,
        request.url,
      ),
    );
  const provider =
    process.env.NEXT_PUBLIC_LOGIN_PROVIDER === "dev" ? "dev" : "kakao";
  const backend =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:8000";
  try {
    const upstream = await fetch(
      `${backend.replace(/\/$/, "")}/api/v1/auth/login/${provider}?returnTo=${encodeURIComponent(returnTo)}`,
      {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (![302, 303, 307].includes(upstream.status)) return fail();
    const location = upstream.headers.get("location");
    if (!location) return fail();
    const target = new URL(location, request.url);
    if (
      target.origin !== request.nextUrl.origin &&
      (target.protocol !== "https:" || target.hostname !== "kauth.kakao.com")
    )
      return fail();
    const response = NextResponse.redirect(target, 302);
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append("Set-Cookie", cookie);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return fail();
  }
}

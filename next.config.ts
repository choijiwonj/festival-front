import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: { root: process.cwd() },
  // FastAPI는 별도 서버. Vercel에서는 같은 출처 /api/v1 프록시로 세션 쿠키를 유지합니다.
  async rewrites() {
    const backend =
      process.env.API_PROXY_TARGET ||
      process.env.BACKEND_URL ||
      "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;

import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/shell";
import "@fontsource-variable/noto-sans-kr";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "축제잇길 · 작은 동네 여행", template: "%s · 축제잇길" },
  description:
    "충남의 축제와 작은 동네를 잇는 여행. 베리 위켄드 프런트엔드 시연.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6ec",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

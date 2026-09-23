import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "레이븐2 길드 관리 시스템",
  description: "RAVEN2 길드원·보스·참여율·사다리 관리"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
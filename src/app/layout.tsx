import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "PeachMarket | 애틀란타 한인 중고거래",
  description: "둘루스, 스와니 등 애틀란타 한인들을 위한 프라이버시 보호 중고거래 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* 모바일 뷰어용 컨테이너 (Desktop 환경에서는 가운데 정렬된 모바일 사이즈 창으로 보임) */}
        <div className="flex-grow w-full max-w-md mx-auto bg-white shadow-sm min-h-screen relative pb-16">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

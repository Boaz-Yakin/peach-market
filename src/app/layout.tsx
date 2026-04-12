import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Plus_Jakarta_Sans, Inter } from "next/font/google";
import AppContainer from "@/components/AppContainer";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeachMarket | 애틀란타 한인 중고거래",
  description: "둘루스, 스와니 등 애틀란타 한인들을 위한 프라이버시 보호 중고거래 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* 모바일 뷰어용 컨테이너 (Desktop 환경에서는 가운데 정렬된 모바일 사이즈 창으로 보임) */}
        <AppContainer>
          {children}
        </AppContainer>
      </body>
    </html>
  );
}

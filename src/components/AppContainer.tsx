"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function AppContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 채팅 상세 페이지(/chat/[id])에서는 하단 네비게이션을 숨깁니다.
  const isChatRoom = pathname?.startsWith("/chat/") && pathname.split("/").length > 2;

  return (
    <div className={`flex-grow w-full max-w-md mx-auto bg-white shadow-sm min-h-screen relative text-gray-900 ${isChatRoom ? "" : "pb-16"}`}>
      {children}
      {!isChatRoom && <BottomNav />}
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function AppContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 네비게이션을 숨길 페이지들 (집중이 필요한 페이지)
  const hideNav = 
    (pathname?.startsWith("/chat/") && pathname.split("/").length > 2) ||
    pathname?.startsWith("/review/") ||
    pathname?.startsWith("/item/") ||
    pathname === "/write" ||
    pathname?.startsWith("/edit/");

  return (
    <div className={`flex-grow w-full max-w-md mx-auto bg-surface min-h-screen relative text-foreground ${hideNav ? "" : "pb-16"}`}>
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
}

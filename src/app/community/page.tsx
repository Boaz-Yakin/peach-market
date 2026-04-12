import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabaseServer";
import SearchHeader from "@/components/SearchHeader";

export const dynamic = 'force-dynamic';

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "전체" } = await searchParams;
  
  // DB 테이블(posts)이 아직 준비되지 않아 쿼리를 잠시 비활성화합니다.
  /*
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false });

  if (category !== "전체") {
    query = query.eq("category", category);
  }
  const { data: posts } = await query;
  */
  const posts: any[] = []; // 임시 빈 배열

  const categories = ["전체", "맛집", "동네생활", "분실물", "취미/모임"];

  return (
    <main className="min-h-screen bg-surface-container-low">
      <Suspense fallback={<div className="h-14 bg-surface" />}>
        <SearchHeader />
      </Suspense>

      {/* Community Categories Bar */}
      <div className="sticky top-14 z-30 glass scrollbar-hide overflow-x-auto opacity-50 pointer-events-none">
        <div className="flex px-4 py-3 gap-2 min-w-max">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                category === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-container-high text-foreground/50"
              }`}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Under Construction State */}
      <div className="px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 animate-pulse text-5xl">
          🏗️
        </div>
        <h2 className="text-[28px] font-black text-foreground font-display leading-tight mb-4">
          피치 광장은 지금<br />공사 중입니다! 🍑
        </h2>
        <p className="text-[16px] text-foreground/50 font-medium leading-relaxed max-w-[280px]">
          이웃들과 더 즐겁게 소통할 수 있는<br />
          공간을 열심히 만들고 있어요.<br />
          조금만 더 기다려 주세요!
        </p>
        
        <div className="mt-12 p-6 bg-surface-container-high/50 rounded-3xl border border-outline-variant/30 w-full max-w-sm">
           <p className="text-[13px] font-bold text-primary mb-2 uppercase tracking-widest pl-1">Coming Soon</p>
           <ul className="text-left space-y-2 text-[14px] text-foreground/70 font-medium">
             <li>🏠 우리 동네 소소한 일상 공유</li>
             <li>🍜 숨은 맛집 및 생활 꿀팁</li>
             <li>🏸 취미 생활을 함께할 이웃 찾기</li>
           </ul>
        </div>
      </div>

      {/* Community Write FAB - Disabled or Hidden */}
      {/* 
      <div className="fixed bottom-20 right-0 left-0 max-w-md mx-auto pointer-events-none z-40">
        <div className="absolute right-4 bottom-0 pointer-events-auto">
          <Link href="/community/write" className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-full shadow-2xl shadow-primary/40 btn-soft">
            ...
          </Link>
        </div>
      </div>
      */}
    </main>
  );
}

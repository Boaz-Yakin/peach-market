import Image from "next/image";
import Link from "next/link";
import CategoryFilter from "../components/CategoryFilter";
import LocalInfoWidget from "../components/LocalInfoWidget";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 작성 시간 계산 헬퍼 함수
function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

import SearchHeader from "../components/SearchHeader";
import { createClient } from "../lib/supabaseServer";
import { getThumbnailUrl } from "../lib/imageUtils";
import AdSlot from "../components/AdSlot";
import { MOCK_ADS } from "../lib/ads";

interface HomeProps {
  searchParams: Promise<{ category?: string; q?: string; hide_sold?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { category, q, hide_sold } = await searchParams;
  const supabase = await createClient();

  // 검색 및 필터링 쿼리
  let queryBuilder = supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  // 키워드 검색
  if (q) {
    queryBuilder = queryBuilder.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);
  }

  // 카테고리 필터
  if (category && category !== "전체") {
    queryBuilder = queryBuilder.eq("category", category);
  }
  
  // 판매 완료 제외 필터
  if (hide_sold === "true") {
    queryBuilder = queryBuilder.neq("status", "sold");
  }

  const { data: dbItems } = await queryBuilder;
  const items = dbItems || [];

  // 광고 삽입 로직: 5개 아이템마다 광고 1개 삽입
  const adFrequency = 5;
  const feedItems: any[] = [];
  
  items.forEach((item, index) => {
    feedItems.push({ type: 'item', data: item });
    if ((index + 1) % adFrequency === 0) {
      const adIndex = Math.floor((index + 1) / adFrequency) - 1;
      if (MOCK_ADS[adIndex % MOCK_ADS.length]) {
        feedItems.push({ type: 'ad', data: MOCK_ADS[adIndex % MOCK_ADS.length] });
      }
    }
  });

  return (
    <main className="min-h-screen bg-surface-container-low">
      <Suspense fallback={<div className="h-14 bg-surface" />}>
        <SearchHeader />
      </Suspense>

      {/* Categories Bar (Client Component) */}
      <Suspense fallback={<div className="h-12" />}>
        <CategoryFilter />
      </Suspense>

      {/* Mini Local Info Widget for Quick Glance */}
      <LocalInfoWidget />

      {/* Feed List (Editorial Showcase Style) */}
      <div className="px-4 py-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8 bg-surface-container-lowest rounded-2xl">
            <span className="text-5xl mb-4">🍑</span>
            <p className="text-[17px] font-bold text-foreground">
              {category ? `'${category}' 카테고리에` : "아직"}
            </p>
            <p className="text-[15px] text-foreground/50 mt-1">등록된 상품이 없습니다.</p>
            <Link
              href="/write"
              className="mt-6 px-6 py-3 bg-primary text-white text-[15px] font-bold rounded-full shadow-lg shadow-primary/30 btn-soft"
            >
              첫 상품 올리기 ✍️
            </Link>
          </div>
        ) : (
          feedItems.map((item, idx) => (
            item.type === 'ad' ? (
              <AdSlot key={`ad-${idx}`} ad={item.data} />
            ) : (
              <Link 
                href={`/item/${item.data.id}`} 
                key={item.data.id} 
                className="flex bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="w-[120px] h-[120px] flex-shrink-0 relative overflow-hidden bg-surface-container-high">
                  <Image 
                    src={getThumbnailUrl(item.data.image_url?.split(',')[0]) || ''} 
                    alt={item.data.title} 
                    fill 
                    sizes="120px"
                    className="object-contain p-1 group-hover:scale-110 transition-transform duration-500" 
                  />
                  
                  {/* 상태 뱃지 오버레이 */}
                  {item.data.status === "reserved" && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg">예약중</span>
                    </div>
                  )}
                  {item.data.status === "sold" && (
                    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-foreground text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg">판매완료</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between p-4 flex-grow overflow-hidden">
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground leading-snug truncate font-display">
                      {item.data.title}
                    </h3>
                    <p className="text-[12px] text-foreground/50 mt-1 font-medium">
                      {item.data.location} • {getTimeAgo(item.data.created_at)}
                    </p>
                    <div className="mt-2 inline-block">
                      <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {item.data.category}
                      </span>
                    </div>
                  </div>
                  <div className="font-extrabold text-[18px] text-primary mt-1 font-display">
                    {isNaN(Number(item.data.price)) ? item.data.price : `$${Number(item.data.price).toLocaleString()}`}
                  </div>
                </div>
              </Link>
            )
          ))
        )}
      </div>

      {/* Add Item FAB Button */}
      <div className="fixed bottom-20 right-0 left-0 max-w-md mx-auto pointer-events-none z-40">
        <div className="absolute right-4 bottom-0 pointer-events-auto">
          <Link href="/write" className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 btn-soft">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}

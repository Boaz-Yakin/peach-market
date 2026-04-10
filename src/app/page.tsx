import Image from "next/image";
import Link from "next/link";
import CategoryFilter from "../components/CategoryFilter";
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

interface HomeProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { category, q } = await searchParams;
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

  const { data: dbItems } = await queryBuilder;
  const items = dbItems || [];

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-14 border-b border-gray-100 bg-white" />}>
        <SearchHeader />
      </Suspense>

      {/* Categories Bar (Client Component) */}
      <Suspense fallback={<div className="h-12 border-b border-gray-50" />}>
        <CategoryFilter />
      </Suspense>

      {/* Feed List */}
      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <span className="text-5xl mb-4">🍑</span>
            <p className="text-[17px] font-semibold text-gray-700">
              {category ? `'${category}' 카테고리에` : "아직"}
            </p>
            <p className="text-[15px] text-gray-400 mt-1">등록된 상품이 없습니다.</p>
            <Link
              href="/write"
              className="mt-6 px-5 py-2.5 bg-[#ff6b6b] text-white text-[15px] font-semibold rounded-xl shadow-md shadow-[#ff6b6b]/30"
            >
              첫 상품 올리기 ✍️
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Link href={`/item/${item.id}`} key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-[110px] h-[110px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm border border-black/5">
                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                
                {/* 상태 뱃지 오버레이 */}
                {item.status === "reserved" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-blue-600 text-white text-[12px] font-bold px-2 py-1 rounded shadow-lg">예약중</span>
                  </div>
                )}
                {item.status === "sold" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-gray-800 text-white text-[12px] font-bold px-2 py-1 rounded shadow-lg">판매완료</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between py-0.5 flex-grow overflow-hidden">
                <div>
                  <h3 className="text-[16px] font-medium text-gray-900 leading-snug truncate">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1">
                    {item.location} • {getTimeAgo(item.created_at)}
                  </p>
                  <div className="mt-1.5 inline-block">
                    <span className="text-[11px] font-semibold text-peach-dark bg-peach-light/40 px-2 py-0.5 rounded-md border border-peach-light/50">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="font-bold text-[17px] text-gray-900 mt-2">
                  {isNaN(Number(item.price)) ? item.price : `$${Number(item.price).toLocaleString()}`}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Add Item FAB Button */}
      <div className="fixed bottom-20 right-0 left-0 max-w-md mx-auto pointer-events-none z-40">
        <div className="absolute right-4 bottom-0 pointer-events-auto">
          <Link href="/write" className="w-14 h-14 bg-peach-dark text-white rounded-full shadow-xl shadow-peach-dark/30 flex items-center justify-center hover:bg-peach transform hover:scale-105 active:scale-95 transition-all">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}

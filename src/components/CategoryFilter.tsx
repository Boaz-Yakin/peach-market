"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  "전체",
  "📦 무빙세일",
  "🚗 중고차 안심",
  "🇰🇷 K-푸드/직거래",
  "📱 전자제품",
  "🪵 가구/인테리어",
  "👗 의류/잡화",
  "🧸 육아/완구",
  "🎨 취미/도서",
  "✨ 기타 중고",
];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") || "전체";

  const handleSelect = (cat: string) => {
    if (cat === "전체") {
      router.push("/");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", cat);
    router.push(`/?${params.toString()}`);
  };

  const isHideSold = searchParams.get("hide_sold") === "true";

  const toggleHideSold = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isHideSold) {
      params.delete("hide_sold");
    } else {
      params.set("hide_sold", "true");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="sticky top-14 z-30 flex flex-col bg-white border-b border-gray-50">
      {/* Category Scroll */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = current === cat;
          return (
            <button
              key={cat}
              onClick={() => handleSelect(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-200 ${
                isActive
                  ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-3 px-5 pb-3">
        <button 
          onClick={toggleHideSold}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border transition-all ${
            isHideSold 
              ? "bg-peach-light/20 border-peach-light text-peach-dark" 
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
            isHideSold ? "border-peach-dark bg-peach-dark" : "border-gray-300 bg-white"
          }`}>
            {isHideSold && <div className="w-1 h-1 bg-white rounded-full"></div>}
          </div>
          거래 가능만 보기
        </button>
      </div>
    </div>
  );
}

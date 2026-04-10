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

  return (
    <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white scrollbar-hide border-b border-gray-50">
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
  );
}

"use client";

import { useState } from "react";
import MyItemCard from "./MyItemCard";
import Link from "next/link";

interface MyItemsListProps {
  initialItems: any[];
}

export default function MyItemsList({ initialItems }: MyItemsListProps) {
  const [items, setItems] = useState(initialItems);
  const [showAll, setShowAll] = useState(false);

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const visibleItems = showAll ? items : items.slice(0, 5);

  if (items.length === 0) {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <div className="text-4xl opacity-50">📦</div>
        <p className="text-gray-400 text-[15px] font-medium">아직 판매 중인 물건이 없네요!</p>
        <Link href="/write" className="inline-block px-6 py-2.5 bg-[#ff6b6b] text-white font-bold rounded-xl shadow-lg shadow-[#ff6b6b]/20">물건 등록하기</Link>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col">
      {visibleItems.map((item) => (
        <MyItemCard key={item.id} item={item} onDelete={handleDelete} />
      ))}
      
      {items.length > 5 && !showAll && (
        <button 
          onClick={() => setShowAll(true)}
          className="w-full py-5 text-center text-[14px] font-bold text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-50"
        >
          나의 전체 목록 보기 (+{items.length - 5}개)
        </button>
      )}
      
      {showAll && items.length > 5 && (
        <button 
          onClick={() => setShowAll(false)}
          className="w-full py-5 text-center text-[14px] font-bold text-gray-400 hover:bg-gray-50 transition-colors border-t border-gray-50"
        >
          목록 접기
        </button>
      )}
    </div>
  );
}

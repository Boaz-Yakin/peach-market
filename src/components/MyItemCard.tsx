"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "../lib/supabaseBrowser";
import { useRouter } from "next/navigation";

interface MyItemCardProps {
  item: any;
  onDelete?: (id: string) => void;
}

export default function MyItemCard({ item, onDelete }: MyItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    const { error } = await supabase.from("items").delete().eq("id", item.id);

    if (error) {
      alert("삭제 실패: " + error.message);
      setIsDeleting(false);
    } else {
      if (onDelete) onDelete(item.id);
      router.refresh();
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return "가격 협의";
    return isNaN(Number(price)) ? price : `$${Number(price).toLocaleString()}`;
  };

  return (
    <div className={`relative group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 ${isDeleting ? 'opacity-50 grayscale' : ''}`}>
      <Link href={`/item/${item.id}`} className="flex-1 flex items-center gap-4 min-w-0">
        {/* Item Image */}
        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden relative border border-black/5 shadow-sm shrink-0">
          <Image src={item.image_url?.split(',')[0] || ''} alt={item.title} fill className="object-cover" />
          
          {/* Status Overlay on profile card */}
          {item.status === "reserved" && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="bg-blue-600 text-[9px] text-white font-black px-1 rounded shadow-sm">예약</span>
            </div>
          )}
          {item.status === "sold" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-gray-800 text-[9px] text-white font-black px-1 rounded shadow-sm">완료</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
             <h4 className="text-[15px] font-bold text-gray-900 truncate">{item.title}</h4>
          </div>
          <p className="text-[13px] text-gray-500 flex items-center gap-1.5">
            {item.category} • <span className="font-medium text-[#ff6b6b]">{formatPrice(item.price)}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
               item.status === 'sold' ? 'text-gray-400 bg-gray-100' : 
               item.status === 'reserved' ? 'text-blue-500 bg-blue-50' : 
               'text-green-500 bg-green-50'
             }`}>
               {item.status === 'sold' ? '판매완료' : item.status === 'reserved' ? '예약중' : '판매중'}
             </span>
          </div>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <Link 
          href={`/edit/${item.id}`}
          className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
          </svg>
        </Link>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

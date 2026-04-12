import Image from "next/image";
import Link from "next/link";
import { createClient } from "../../../lib/supabaseServer"; // Server client로 변경
import { notFound } from "next/navigation";
import WishlistButton from "../../../components/WishlistButton";
import OwnerActions from "../../../components/OwnerActions";
import ChatButton from "../../../components/ChatButton";
import StatusSelector from "../../../components/StatusSelector";
import ShareButton from "../../../components/ShareButton";

export const dynamic = "force-dynamic";

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

function formatPrice(price: string) {
  if (!price) return "가격 협의";
  return isNaN(Number(price)) ? price : `$${Number(price).toLocaleString()}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  const { data: item, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  // 작성자 여부 확인
  const isOwner = user && item.user_id === user.id;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Sticky Header */}
      <header className="flex justify-between items-center px-4 h-14 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-40">
        <Link href="/" className="p-2 -ml-2 text-gray-800 transition-opacity hover:opacity-70" aria-label="뒤로 가기">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <div className="flex items-center gap-1">
          {/* 작성자라면 수정/삭제 버튼 노출 */}
          {isOwner && (
            <OwnerActions itemId={item.id} />
          )}
          
          <ShareButton />
        </div>
      </header>

      {/* Item Image */}
      <div className="w-full aspect-square bg-gray-100 relative">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <main className="flex-1 pb-32">
        {/* Seller Info Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
             <span className="text-white font-bold text-[16px]">🍑</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">피치마켓 사용자 {isOwner && "(나)"}</p>
            <p className="text-[13px] text-gray-500">{item.location}</p>
          </div>
        </div>

        {/* Item Info */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          {/* 상태 변경 (주인용) */}
          {isOwner && (
            <StatusSelector itemId={item.id} initialStatus={item.status} />
          )}

          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-block text-[12px] font-semibold text-[#ff6b6b] bg-red-50 px-2.5 py-1 rounded-md">
              {item.category}
            </span>
            {item.status === "reserved" && (
              <span className="inline-block text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                예약중
              </span>
            )}
            {item.status === "sold" && (
              <span className="inline-block text-[12px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                판매완료
              </span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{item.title}</h1>
          <p className="text-[13px] text-gray-400 mt-1.5">{getTimeAgo(item.created_at)}</p>
        </div>

        {/* Description */}
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-[16px] text-gray-700 leading-relaxed whitespace-pre-line text-pretty">
            {item.description || "상세 설명이 없습니다."}
          </p>
        </div>

        {/* Location Info */}
        <div className="px-5 py-4 flex items-center gap-2 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="text-[14px]">거래 희망 장소: <span className="font-medium text-gray-700">{item.location}</span></span>
        </div>
      </main>

      {/* Bottom CTA Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-100 px-5 py-4 flex items-center justify-between z-20">
        <div>
          <p className="text-[13px] text-gray-400 leading-none mb-0.5 font-medium">가격</p>
          <p className="text-[21px] font-bold text-gray-900 leading-tight tracking-tight">{formatPrice(item.price)}</p>
        </div>

        {/* 찜하기 & 채팅하기 */}
        <div className="flex items-center gap-3">
          <WishlistButton itemId={item.id} />
          {!isOwner && (
            <ChatButton 
              itemId={item.id} 
              sellerId={item.user_id} 
              buyerId={user?.id} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { createClient } from "../../../lib/supabaseServer"; // Server client로 변경
import { notFound } from "next/navigation";
import WishlistButton from "../../../components/WishlistButton";
import OwnerActions from "../../../components/OwnerActions";
import ChatButton from "../../../components/ChatButton";
import StatusSelector from "../../../components/StatusSelector";
import ShareButton from "../../../components/ShareButton";
import { getOptimizedImageUrl } from "../../../lib/imageUtils";

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

  // 작성자 및 판매자 정보 가져오기
  const isOwner = user && item.user_id === user.id;

  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', item.user_id)
    .single();

  const sellerName = sellerProfile?.display_name || "피치마켓 사용자";
  const sellerBrix = sellerProfile?.peach_brix || 36.5;
  const sellerAvatar = sellerProfile?.avatar_url;

  // 4. 이미 리뷰를 남겼는지 확인 (중복 방지)
  let hasReviewed = false;
  if (user) {
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('item_id', id)
      .eq('reviewer_id', user.id)
      .maybeSingle();
    
    if (reviewCheckError) {
      console.error("Review check error:", reviewCheckError.message);
    }

    if (existingReview) {
      hasReviewed = true;
      console.log(`[ReviewCheck] User ${user.id} has reviewed item ${id}`);
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-surface-container-low">
      {/* Sticky Header */}
      <header className="flex justify-between items-center px-4 h-14 glass sticky top-0 z-40">
        <Link href="/" className="p-2 -ml-2 text-foreground transition-opacity hover:opacity-70 btn-soft" aria-label="뒤로 가기">
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

      {/* Item Images */}
      {(() => {
        const imageUrls = item.image_url ? item.image_url.split(',') : [];
        return (
          <div className="w-full aspect-square bg-surface-container-high relative overflow-hidden group">
            {imageUrls.length > 0 ? (
              <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
                {imageUrls.map((url: string, index: number) => (
                  <div key={index} className="w-full h-full flex-shrink-0 snap-center relative">
                    <Image
                      src={getOptimizedImageUrl(url)}
                      alt={`${item.title} - 사진 ${index + 1}`}
                      fill
                      sizes="(max-width: 448px) 100vw, 448px"
                      className="object-contain"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                이미지 없음
              </div>
            )}
            
            {/* Pagination Badge */}
            {imageUrls.length > 1 && (
               <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wider z-10 pointer-events-none">
                 {imageUrls.length}장의 사진 👉
               </div>
            )}

            {/* Editorial Overlap Price */}
            <div className="absolute bottom-6 left-6 glass px-5 py-2 rounded-2xl shadow-xl z-10 pointer-events-none">
              <p className="text-[24px] font-black text-primary font-display">{formatPrice(item.price)}</p>
            </div>
          </div>
        );
      })()}

      {/* Content */}
      <main className="flex-1 pb-32">
        {/* Seller Info Row - Tonal Layering */}
        <div className="mx-4 mt-6 p-4 bg-surface-container-lowest rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ring-4 ring-surface-container-low">
               {sellerAvatar ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={sellerAvatar} alt="Seller" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-white font-black text-[20px]">🍑</span>
               )}
            </div>
            <div>
              <p className="text-[16px] font-bold text-foreground leading-tight font-display">{sellerName} {isOwner && "(나)"}</p>
              <p className="text-[12px] text-foreground/50 mt-1 font-medium">{item.location}</p>
            </div>
          </div>
          
          {/* Seller Temperature / Brix */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1.5">
               <span className="text-[15px] font-black text-primary">{sellerBrix}%</span>
               <span className="text-[18px] leading-none">🍑</span>
            </div>
            <div className="w-24 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${sellerBrix}%` }}></div>
            </div>
          </div>
        </div>

        {/* Item Info */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {item.category}
            </span>
            {item.status === "reserved" && (
              <span className="inline-block text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                예약중
              </span>
            )}
            {item.status === "sold" && (
              <span className="inline-block text-[11px] font-black text-foreground/50 bg-foreground/5 px-3 py-1 rounded-full border border-foreground/10">
                판매완료
              </span>
            )}
          </div>

          {/* 주인용 상태 변경 */}
          {isOwner && (
            <div className="mb-6 p-4 bg-surface-container-high/50 rounded-2xl border border-outline-variant/30">
              <p className="text-[13px] font-bold text-foreground/60 mb-3">거래 상태 변경</p>
              <StatusSelector itemId={item.id} initialStatus={item.status} />
            </div>
          )}

          <h1 className="text-[26px] font-black text-foreground leading-tight tracking-tight font-display">{item.title}</h1>
          <p className="text-[13px] text-foreground/40 mt-2 font-medium">{getTimeAgo(item.created_at)}</p>
        </div>

        {/* Description */}
        <div className="px-6 py-4">
          <p className="text-[17px] text-foreground/80 leading-relaxed whitespace-pre-line text-pretty">
            {item.description || "상세 설명이 없습니다."}
          </p>
        </div>

        {/* Review Trigger for Sold Items */}
        {item.status === "sold" && !hasReviewed && (
          <div className="mx-6 mt-8 p-6 bg-primary-container/20 rounded-3xl border border-primary/20 flex flex-col items-center text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-[18px] font-black text-primary font-display mb-2">거래가 완료되었나요?</h3>
            <p className="text-[14px] text-primary/70 mb-6 font-medium">상대방에게 &apos;피치 당도&apos;를 선물해 주세요!</p>
            <Link 
              href={`/review/${item.id}`}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[16px] shadow-xl shadow-primary/30 btn-soft"
            >
              거래 평가하러 가기 🍑
            </Link>
          </div>
        )}
      </main>

      {/* Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass px-6 py-5 flex items-center justify-between z-20 pb-safe shadow-[0_-10px_30px_rgba(18,28,42,0.05)] rounded-t-3xl">
        <div className="flex flex-col">
          <p className="text-[12px] text-foreground/40 font-bold mb-0.5">희망 가격</p>
          <p className="text-[24px] font-black text-primary leading-tight font-display">{formatPrice(item.price)}</p>
        </div>

        {/* 찜하기 & 채팅하기 */}
        <div className="flex items-center gap-3">
          <WishlistButton itemId={item.id} />
          {!isOwner && (
            <div className="flex-1">
              <ChatButton 
                itemId={item.id} 
                sellerId={item.user_id} 
                buyerId={user?.id} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

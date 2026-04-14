"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import Link from "next/link";

interface ReviewFormProps {
  itemId: string;
  itemTitle: string;
  targetId: string;
  targetName: string;
  userId: string;
}

const POSITIVE_BADGES = [
  { id: "p1", text: "시간 약속을 잘 지켜요", icon: "⏰" },
  { id: "p2", text: "응답이 빨라요", icon: "💬" },
  { id: "p3", text: "친절하고 매너있어요", icon: "😊" },
  { id: "p4", text: "물건 상태가 설명과 같아요", icon: "💎" },
  { id: "p5", text: "좋은 물건을 저렴하게 파세요", icon: "💸" },
];

export default function ReviewForm({ itemId, itemTitle, targetId, targetName, userId }: ReviewFormProps) {
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleBadge = (id: string) => {
    setSelectedBadges(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. 단일 RPC 호출로 트랜잭션 처리 (보안 및 정합성 확보)
      const { data, error: rpcError } = await supabase.rpc('submit_review', {
        p_item_id: itemId,
        p_reviewer_id: userId,
        p_target_id: targetId,
        p_badges: selectedBadges
      });

      if (rpcError) throw rpcError;

      const { success, new_brix, bonus } = data as { success: boolean, new_brix: number, bonus: number };

      if (!success) throw new Error("평가 반영에 실패했습니다.");

      // 2. 알림 전송 (신뢰 기반 인터랙션)
      await supabase.from('notifications').insert({
        user_id: targetId,
        title: "🍑 피치 당도가 올라갔어요!",
        content: `'${itemTitle}' 거래 후 따뜻한 평가를 받아 당도가 ${bonus.toFixed(1)}% 상승했습니다.`,
        type: "review"
      });

      alert(`평가가 완료되었습니다! ${targetName}님의 당도가 ${new_brix.toFixed(1)}%가 되었습니다. 🍑`);
      router.push(`/item/${itemId}`);
      router.refresh(); // 상세 페이지 새로고침 유도
    } catch (err: any) {
      console.error("Evaluation submission failed:", err);
      const errorMessage = err.message || "알 수 없는 오류가 발생했습니다.";
      alert(`평가 반영 중 오류가 발생했습니다: ${errorMessage}\n(이미 평가하셨거나 서버 설정이 필요할 수 있습니다)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="flex items-center px-4 h-14 glass sticky top-0 z-40">
        <Link href={`/item/${itemId}`} className="p-2 -ml-2 text-foreground btn-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="flex-1 text-center font-black text-[17px] mr-8 font-display">거래 평가</h1>
      </header>

      <main className="flex-1 px-6 pt-10 pb-20">
        <div className="text-center mb-10">
          <div className="text-5xl mb-6 animate-bounce">🍑</div>
          <h2 className="text-[24px] font-black text-foreground font-display leading-tight mb-2">
            {targetName}님과의<br />거래는 어떠셨나요?
          </h2>
          <p className="text-[14px] text-foreground/40 font-medium tracking-tight">
            전달해주신 평가는 상대방의 '피치 당도'에 반영되어<br />신뢰받는 커뮤니티를 만드는 데 큰 힘이 됩니다.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] font-black text-primary mb-2 uppercase tracking-widest pl-1">Good Points</p>
          {POSITIVE_BADGES.map((badge) => (
            <button
              key={badge.id}
              onClick={() => toggleBadge(badge.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 text-left btn-soft ${
                selectedBadges.includes(badge.id)
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                  : "bg-surface-container-lowest border-transparent text-foreground shadow-sm hover:border-primary/20"
              }`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[16px] font-bold">{badge.text}</span>
            </button>
          ))}
        </div>

        <div className="mt-12 bg-surface-container-high/50 p-6 rounded-3xl border border-outline-variant/30">
           <h4 className="text-[15px] font-bold text-foreground mb-2 font-display">💡 팁!</h4>
           <p className="text-[13px] text-foreground/60 leading-relaxed">
             솔직하고 정성스러운 평가는 이웃 간의 따뜻한 연결을 돕습니다. 
             거래 중 불편한 점이 있었다면 '신고하기' 기능을 통해 알려주세요.
           </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 pt-2 bg-gradient-to-t from-surface-container-low via-surface-container-low to-transparent">
        <button
          onClick={handleSubmit}
          disabled={selectedBadges.length === 0 || isSubmitting}
          className={`w-full py-5 rounded-2xl font-black text-[18px] transition-all shadow-xl font-display ${
            selectedBadges.length > 0 
              ? "bg-primary text-white shadow-primary/30 active:scale-95" 
              : "bg-surface-container-high text-foreground/20 cursor-not-allowed shadow-none"
          }`}
        >
          {isSubmitting ? "전송 중..." : "평가 완료하기 🍑"}
        </button>
      </footer>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function CommentInput({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다!");
        return;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim()
      });

      if (error) throw error;

      // --- 푸시 알림 트리거 (전략적 고도화) ---
      try {
        // 1. 게시글 작성자 ID 가져오기
        const { data: post } = await supabase
          .from("posts")
          .select("user_id")
          .eq("id", postId)
          .single();

        if (post && post.user_id !== user.id) {
          // 2. 작성자에게 알림 전송 (본인 글에 본인이 단 댓글은 제외)
          await fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: post.user_id,
              title: "🍑 내 글에 새로운 댓글이 달렸어요!",
              body: content.trim().substring(0, 50) + (content.length > 50 ? "..." : ""),
              url: `/community/${postId}`
            })
          });
        }
      } catch (pushErr) {
        console.error("Push notification failed:", pushErr);
      }
      // ------------------------------------

      setContent("");
      router.refresh(); // 새로고침해서 댓글 표시
    } catch (error) {
      console.error(error);
      alert("댓글 작성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-[64px] left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 p-3 pb-safe z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="따뜻한 댓글을 남겨주세요..."
          className="flex-1 bg-gray-100 text-[14px] px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#ff6b6b]/30"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="bg-[#ff6b6b] text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

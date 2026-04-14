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
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-3 pb-safe z-20">
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

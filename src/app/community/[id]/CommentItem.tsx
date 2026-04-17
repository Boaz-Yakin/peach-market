"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabaseBrowser";

interface CommentItemProps {
  comment: any;
  currentUserId: string | null;
  postAuthorId: string;
}

export default function CommentItem({ comment, currentUserId, postAuthorId }: CommentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "방금 전";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  const handleDelete = async () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", comment.id)
        .eq("user_id", currentUserId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const isOwner = currentUserId === comment.user_id;

  return (
    <div className={`flex gap-3 px-4 py-3 transition-opacity ${isDeleting ? "opacity-50" : "opacity-100"}`}>
      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
        {comment.profiles?.avatar_url ? (
          <Image src={comment.profiles.avatar_url} alt="profile" width={36} height={36} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-[12px]">
            {comment.profiles?.display_name?.charAt(0) || "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[14px] text-gray-900 leading-none">
              {comment.profiles?.display_name || "익명"}
            </span>
            {comment.user_id === postAuthorId && (
              <span className="bg-[#ff6b6b]/10 text-[#ff6b6b] text-[10px] font-bold px-1.5 py-0.5 rounded">작성자</span>
            )}
            <span className="text-[11px] text-gray-400 font-medium">
              {getTimeAgo(comment.created_at)}
            </span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-6 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-24 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {isOwner ? (
                    <button 
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-500 hover:bg-red-50"
                    >
                      삭제하기
                    </button>
                  ) : (
                    <button 
                      className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        alert("신고 시스템 준비 중입니다.");
                        setShowMenu(false);
                      }}
                    >
                      신고하기
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-[14px] text-gray-800 leading-[1.6] break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

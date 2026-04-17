"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseBrowser";

interface PostActionsProps {
  postId: string;
  authorId: string;
  currentUserId: string | null;
}

export default function PostActions({ postId, authorId, currentUserId }: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!currentUserId) return null;

  const handleBlock = async () => {
    if (authorId === currentUserId) return;
    if (!confirm("이 사용자를 차단하시겠습니까? 차단하면 이 사용자의 글과 댓글이 보이지 않습니다.")) return;
    
    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: currentUserId,
          blocked_id: authorId
        });

      if (error) {
        if (error.code === '23505') {
          alert("이미 차단된 사용자입니다.");
        } else {
          throw error;
        }
      } else {
        alert("사용자가 차단되었습니다.");
        router.push("/community");
      }
    } catch (err) {
      console.error(err);
      alert("차단 실패");
    } finally {
      setIsBlocking(false);
      setShowMenu(false);
    }
  };

  const handleReport = () => {
    alert("신고 접수 페이지로 연결하거나 폼을 띄울 예정입니다. (Phase 2.5)");
    setShowMenu(false);
  };

  return (
    <div className="relative ml-auto">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-48 z-30 animate-in fade-in zoom-in-95 duration-200">
            {authorId !== currentUserId ? (
              <>
                <button 
                  onClick={handleReport}
                  className="w-full text-left px-5 py-3 text-[14px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="text-lg">🚩</span> 게시글 신고하기
                </button>
                <div className="h-px bg-gray-50 mx-2" />
                <button 
                  onClick={handleBlock}
                  disabled={isBlocking}
                  className="w-full text-left px-5 py-3 text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50"
                >
                  <span className="text-lg">🚫</span> 사용자 차단하기
                </button>
              </>
            ) : (
              <Link href={`/community/edit/${postId}`} className="w-full text-left px-5 py-3 text-[14px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                 <span className="text-lg">✏️</span> 글 수정하기
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

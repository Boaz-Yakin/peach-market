"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 추가
import { createClient } from "../lib/supabaseBrowser";

export default function OwnerActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("items").delete().eq("id", itemId);

    if (error) {
      alert("삭제에 실패했습니다: " + error.message);
      setIsDeleting(false);
      setShowConfirm(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* 수정 버튼 */}
      <Link
        href={`/edit/${itemId}`}
        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="수정"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
        </svg>
      </Link>

      {/* 삭제 버튼 */}
      <button 
        onClick={() => setShowConfirm(true)}
        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
        aria-label="삭제"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">정말로 삭제할까요?</h3>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              삭제된 게시글은 다시 복구할 수 없습니다. 신중하게 결정해 주세요!
            </p>
            <div className="flex gap-3">
              <button 
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-[15px] text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button 
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-[15px] text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? "삭제 중..." : "글 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { createClient } from "../lib/supabaseBrowser";

export default function OwnerActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const modalContent = showConfirm && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => !isDeleting && setShowConfirm(false)} 
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[32px] p-8 w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-300 ease-out flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        
        <h3 className="text-[20px] font-bold text-gray-900 mb-2">정말로 삭제할까요?</h3>
        <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
          삭제된 게시글은 다시 복구할 수 없습니다.<br/>정말 삭제하시겠습니까?
        </p>
        
        <div className="flex gap-3 w-full">
          <button 
            disabled={isDeleting}
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-4 px-4 rounded-2xl font-bold text-[16px] text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
          >
            취소
          </button>
          <button 
            disabled={isDeleting}
            onClick={handleDelete}
            className="flex-1 py-4 px-4 rounded-2xl font-bold text-[16px] text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-500/30"
          >
            {isDeleting ? "삭제 중..." : "글 삭제"}
          </button>
        </div>
      </div>
    </div>
  );

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

      {/* Confirmation Modal via Portal */}
      {mounted && createPortal(modalContent, document.body)}
    </div>
  );
}

"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    // Web Share API support check
    if (navigator.share) {
      try {
        await navigator.share({
          title: "피치마켓 | 🍑 상큼한 중고거래",
          text: "이 상품 어때요? 피치마켓에서 확인해보세요!",
          url: url,
        });
        return;
      } catch (err) {
        console.error("공유 실패:", err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("링크 복사 실패:", err);
      alert("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleShare}
        className="p-2 text-gray-600 hover:text-gray-900 transition-all active:scale-90 relative" 
        aria-label="공유"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        
        {/* Tooltip-like badge */}
        {copied && (
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
            링크 복사됨!
          </span>
        )}
      </button>
    </div>
  );
}

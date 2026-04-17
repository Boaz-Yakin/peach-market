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

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

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

  const submitReport = async (reason: string) => {
    setIsReporting(true);
    try {
      // 1. reports 테이블에 기록
      const { error } = await supabase
        .from("reports") // 또는 post_reports
        .insert({
          post_id: postId,
          reporter_id: currentUserId,
          reason: reason
        });

      if (error) throw error;

      alert("신고가 접수되었습니다. 깨끗한 피치 광장을 위해 노력하겠습니다! 🍑");
      setShowReportModal(false);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
      alert("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setIsReporting(false);
    }
  };

  const REPORT_REASONS = [
    "광고/스팸성 게시글",
    "부적절한 언어/욕설",
    "사기/불법 거래 의혹",
    "게시판 주제에 맞지 않음",
    "기타"
  ];

  return (
    <div className="relative ml-auto">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-400 hover:text-gray-900 transition-all active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-10 bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-3 w-52 z-30 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {authorId !== currentUserId ? (
              <>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full text-left px-5 py-3.5 text-[14.5px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <span className="text-xl">🚩</span> 신고하기
                </button>
                <div className="h-px bg-gray-50 mx-4 my-1" />
                <button 
                  onClick={handleBlock}
                  disabled={isBlocking}
                  className="w-full text-left px-5 py-3.5 text-[14.5px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 transition-colors"
                >
                  <span className="text-xl">🚫</span> 사용자 차단
                </button>
              </>
            ) : (
              <Link 
                href={`/community/edit/${postId}`} 
                className="w-full text-left px-5 py-3.5 text-[14.5px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                 <span className="text-xl">✏️</span> 글 수정하기
              </Link>
            )}
          </div>
        </>
      )}

      {/* 신고 모달 (Bottom Sheet) */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-t-[40px] shadow-2xl pb-12 safe-area-inset-bottom z-10 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4" />
            <div className="px-8 pt-4 pb-6">
              <h3 className="text-[20px] font-black text-gray-900 mb-6 font-display">게시글 신고 🍑</h3>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => submitReport(reason)}
                    disabled={isReporting}
                    className="w-full text-left p-5 rounded-2xl bg-gray-50 hover:bg-peach-light/10 text-[15px] font-bold text-gray-800 transition-all active:scale-[0.98] flex justify-between items-center group"
                  >
                    {reason}
                    <span className="opacity-0 group-active:opacity-100 transition-opacity">✨</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="w-full mt-6 py-4 text-[14px] font-bold text-gray-400"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

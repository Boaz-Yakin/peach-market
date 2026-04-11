"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '../lib/supabaseBrowser';

export default function BottomNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastLatestMessageId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkUnreadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 내가 접속된 활성 채팅방들 가져오기
      const { data: rooms } = await supabase.from('chat_rooms').select('*').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      if (!rooms || rooms.length === 0) return;
      
      const activeRoomIds = rooms.filter(r => {
        if (r.seller_id === user.id && r.is_seller_left) return false;
        if (r.buyer_id === user.id && r.is_buyer_left) return false;
        return true;
      }).map(r => r.id);

      if (activeRoomIds.length === 0) return;

      // 2. 해당 방들의 안읽은 메시지 가져오기 (JS 필터링을 통해 SQL 에러 원천 차단)
      const { data: unreadMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .in('room_id', activeRoomIds)
        .neq('sender_id', user.id);
        
      if (error) return;
      
      const realUnread = unreadMsgs.filter(m => m.is_read === false);
      
      if (isMounted) {
        setUnreadCount(realUnread.length);
        
        // 새 메시지 감지 (토스트 알림)
        if (realUnread.length > 0) {
          const latest = realUnread.reduce((prev, current) => 
            (new Date(prev.created_at) > new Date(current.created_at)) ? prev : current
          );
          
          if (lastLatestMessageId.current !== null && lastLatestMessageId.current !== latest.id) {
            setToastMessage("새로운 메시지가 도착했습니다! 🍑");
            setTimeout(() => { if (isMounted) setToastMessage(null); }, 3000);
          }
          lastLatestMessageId.current = latest.id;
        } else {
          lastLatestMessageId.current = null;
        }
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [supabase]);

  return (
    <>
      {/* 팝업(Toast) 알림 */}
      {toastMessage && (
        <div className="fixed top-16 left-0 right-0 z-[100] mx-4 flex items-center justify-center animate-in slide-in-from-top-5 fade-in duration-300">
          <Link href="/chat" className="bg-peach-dark text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-peach-dark/30 font-bold flex items-center gap-3 transition-transform active:scale-95 text-[15px]">
            <span className="text-xl animate-bounce">💌</span>
            {toastMessage}
          </Link>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white border-t border-gray-100 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center justify-center w-full text-peach-dark">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-semibold">홈</span>
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center justify-center w-full text-gray-600 hover:text-[#ff6b6b] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="text-xs">내 찜</span>
          </Link>
          <Link href="/chat" className="relative flex flex-col items-center justify-center w-full text-gray-600 hover:text-peach-dark transition-colors">
            <div className="relative">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs">채팅</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center justify-center w-full text-gray-600 hover:text-peach-dark transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">내 정보</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

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
  const activeRoomIdsRef = useRef<string[]>([]);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    
    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found for notifications");
        return;
      }
      currentUserIdRef.current = user.id;

      // 1. 내 활성 채팅방 ID 목록 가져오기
      const fetchRoomsAndUnread = async () => {
        console.log("Fetching rooms for user:", user.id);
        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select('id, seller_id, buyer_id, is_seller_left, is_buyer_left')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
        
        if (rooms) {
          activeRoomIdsRef.current = rooms
            .filter(r => {
              if (r.seller_id === user.id && r.is_seller_left) return false;
              if (r.buyer_id === user.id && r.is_buyer_left) return false;
              return true;
            })
            .map(r => r.id);
          
          console.log("Active Room IDs:", activeRoomIdsRef.current);

          if (activeRoomIdsRef.current.length > 0) {
            const { data: unreadMsgs, error } = await supabase
              .from('messages')
              .select('id')
              .in('room_id', activeRoomIdsRef.current)
              .neq('sender_id', user.id)
              .eq('is_read', false);
            
            if (unreadMsgs && isMounted) {
              console.log("Unread Messages count:", unreadMsgs.length);
              setUnreadCount(unreadMsgs.length);
            }
            if (error) console.error("Unread fetch error:", error);
          } else {
            if (isMounted) setUnreadCount(0);
          }
        }
      };

      await fetchRoomsAndUnread();

      // 2. 실시간 구독 설정
      channel = supabase
        .channel('global_notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            console.log("Realtime message event:", payload.eventType);
            fetchRoomsAndUnread(); // 실시간 이벤트 시 전체 다시 가져와서 정확성 보장
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_rooms' },
          () => {
            console.log("Realtime room event");
            fetchRoomsAndUnread();
          }
        )
        .subscribe((status) => {
          console.log("Subscription status:", status);
        });
    };

    initializeNotifications();

    // 30초마다 한 번씩 강제 동기화 (보안망)
    const safetyCheck = setInterval(() => {
      initializeNotifications();
    }, 30000);

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      clearInterval(safetyCheck);
    };
  }, [supabase, pathname]);

  return (
    <>
      {/* 팝업(Toast) 알림 */}
      {toastMessage && (
        <div className="fixed top-20 left-0 right-0 z-[100] mx-4 flex items-center justify-center animate-in slide-in-from-top-5 fade-in duration-500">
          <Link 
            href="/chat" 
            onClick={() => setToastMessage(null)}
            className="bg-white border border-peach-light/30 backdrop-blur-xl px-6 py-4 rounded-[24px] shadow-[0_20px_40px_rgba(255,107,107,0.15)] font-bold flex items-center gap-4 transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 bg-peach-light/20 rounded-full flex items-center justify-center text-xl animate-bounce">
              💌
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-peach-dark/60 font-medium">새로운 대화</span>
              <span className="text-[15px] text-gray-900">{toastMessage}</span>
            </div>
            <div className="ml-2 text-peach-dark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </Link>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className={`flex flex-col items-center justify-center w-full transition-colors ${pathname === '/' ? 'text-peach-dark' : 'text-gray-400'}`}>
            <svg className="w-6 h-6 mb-1" fill={pathname === '/' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link href="/wishlist" className={`flex flex-col items-center justify-center w-full transition-colors ${pathname === '/wishlist' ? 'text-peach-dark' : 'text-gray-400'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={pathname === '/wishlist' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="text-[10px] font-bold">내 찜</span>
          </Link>
          <Link href="/chat" className={`relative flex flex-col items-center justify-center w-full transition-colors ${pathname.includes('/chat') ? 'text-peach-dark' : 'text-gray-400'}`}>
            <div className="relative">
              <svg className="w-6 h-6 mb-1" fill={pathname.includes('/chat') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#ff4d4d] text-white rounded-full flex items-center justify-center text-[9px] font-black px-1 shadow-[0_2px_4px_rgba(255,77,77,0.3)] border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">채팅</span>
          </Link>
          <Link href="/profile" className={`flex flex-col items-center justify-center w-full transition-colors ${pathname === '/profile' ? 'text-peach-dark' : 'text-gray-400'}`}>
            <svg className="w-6 h-6 mb-1" fill={pathname === '/profile' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">내 정보</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

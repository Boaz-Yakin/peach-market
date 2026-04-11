"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatRoom {
  id: string;
  item: {
    id: string;
    title: string;
    image_url: string;
  };
  seller_id: string;
  buyer_id: string;
  created_at: string;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/profile");
        return;
      }

      // 내가 구매자거나 판매자인 방을 모두 가져옴
      const { data, error } = await supabase
        .from("chat_rooms")
        .select(`
          *,
          item:items (
            id,
            title,
            image_url
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("채팅방을 가져오는 중 에러 발생:", error);
      } else if (data) {
        // Javascript 단에서 확실하게 필터링
        const activeRooms = data.filter((room: any) => {
          const isSeller = room.seller_id === user.id;
          const isBuyer = room.buyer_id === user.id;
          if (isSeller && room.is_seller_left) return false;
          if (isBuyer && room.is_buyer_left) return false;
          return true;
        });
        
        // 각 채팅방별 안읽은 메시지 갯수 계산 및 최근 메시지 기준 정렬
        if (activeRooms.length > 0) {
          const roomIds = activeRooms.map((r: any) => r.id);
          const { data: allMsgs, error: msgsError } = await supabase
            .from('messages')
            .select('room_id, is_read, created_at, sender_id')
            .in('room_id', roomIds);

          if (!msgsError && allMsgs) {
            const counts: Record<string, number> = {};
            const lastActivity: Record<string, number> = {};

            allMsgs.forEach(m => {
              // 1. 안읽은 메시지 계산 (상대방이 보낸 것만)
              if (m.is_read === false && m.sender_id !== user.id) {
                counts[m.room_id] = (counts[m.room_id] || 0) + 1;
              }
              // 2. 이 방의 가장 최신 메시지 시간 갱신
              const msgTime = new Date(m.created_at).getTime();
              if (!lastActivity[m.room_id] || msgTime > lastActivity[m.room_id]) {
                lastActivity[m.room_id] = msgTime;
              }
            });
            setUnreadCounts(counts);

            // 3. activeRooms 재정렬 (최근 메시지 시간 우선, 없으면 방 생성 시간)
            activeRooms.sort((a: any, b: any) => {
              const timeA = lastActivity[a.id] || new Date(a.created_at).getTime();
              const timeB = lastActivity[b.id] || new Date(b.created_at).getTime();
              return timeB - timeA; // 내림차순 최상단 우선
            });
          }
          
          setRooms(activeRooms as unknown as ChatRoom[]);
        } else {
          setRooms([]);
        }
      }
      setIsLoading(false);
    };

    fetchRooms();

    // 앱 화면으로 다시 돌아올 때마다 갱신 (빠른 반응성)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchRooms();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 상대방이 새 채팅을 걸었을 때 자동으로 뜨도록 5초마다 자동 갱신 (폴링)
    const pollInterval = setInterval(() => {
      fetchRooms();
    }, 5000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [supabase, router]);

  if (isLoading) return <div className="p-10 text-center">채팅 목록 불러오는 중... 🍑</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-4 h-14 shadow-sm pt-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="text-[18px] font-bold text-gray-900 ml-2">채팅</h1>
      </header>

      {/* 채팅방 리스트 */}
      <main className="flex-1 pb-20">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
            <span className="text-5xl">💬</span>
            <p className="text-[15px]">아직 대화 중인 채팅방이 없어요.</p>
            <Link href="/" className="text-[#ff6b6b] font-bold text-sm">
              물건 구경하러 가기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="relative flex items-center bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <Link 
                  href={`/chat/${room.id}`}
                  className="flex-1 flex items-center gap-4 px-4 py-4 min-w-0"
                >
                  {/* 물건 이미지 */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-100">
                    <Image src={room.item.image_url} alt={room.item.title} fill className="object-cover" />
                  </div>

                  {/* 방 정보 */}
                  <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-gray-900 truncate">
                        익명의 복숭아
                      </h3>
                      {unreadCounts[room.id] > 0 && (
                        <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm flex-shrink-0 leading-none min-w-[16px] text-center">
                          {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(room.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-500 truncate mb-1">
                    {room.item.title}
                  </p>
                  <p className="text-[13px] text-gray-400 font-medium italic">
                    새로운 대화를 이어가보세요! 🍑
                  </p>
                  </div>
                </Link>

                {/* 나가기 버튼 */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (!window.confirm("이 채팅방을 나가시겠습니까?\n더 이상 목록에 표시되지 않습니다.")) return;
                    
                    // DB 업데이트 (낙관적 UI 반영)
                    setRooms(prev => prev.filter(r => r.id !== room.id));
                    
                    supabase.auth.getUser().then(({ data: { user } }) => {
                      if (user) {
                        const updateColumn = user.id === room.seller_id ? "is_seller_left" : "is_buyer_left";
                        supabase.from("chat_rooms").update({ [updateColumn]: true }).eq("id", room.id).then();
                      }
                    });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-full z-10"
                  aria-label="채팅방 나가기"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

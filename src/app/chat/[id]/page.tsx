"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabaseBrowser";
import Image from "next/image";
import Link from "next/link";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatRoom {
  id: string;
  item: {
    id: string;
    title: string;
    price: number;
    image_url: string;
  };
  seller_id: string;
  buyer_id: string;
}

export default function ChatRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      // 1. 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/profile");
        return;
      }
      setCurrentUser(user);

      // 2. 채팅방 및 상품 정보 가져오기
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select(`
          id,
          seller_id,
          buyer_id,
          item:items (
            id,
            title,
            price,
            image_url
          )
        `)
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        console.error("방 정보를 가져올 수 없습니다:", roomError);
        return;
      }
      setRoomInfo(room as unknown as ChatRoom);

      // 3. 기존 메시지 불러오기 (최신순 정렬 -> 레이아웃에서 reverse 처리)
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false }); // 최신이 위로 오게 (flex-col-reverse 연동)

      if (msgs) setMessages(msgs);

      // 4. 실시간 메시지 수신 설정
      console.log("실시간 구독 시작:", roomId);
      const channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          { 
            event: "INSERT", 
            schema: "public", 
            table: "messages", 
            filter: `room_id=eq.${roomId}` 
          },
          (payload) => {
            console.log("새 메시지 수신!", payload);
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              
              const isFromMe = newMessage.sender_id === user.id;
              if (isFromMe) return prev;
              
              return [newMessage, ...prev];
            });
          }
        )
        .subscribe((status) => {
          console.log(`구독 상태 변경: ${status}`);
          if (status === 'SUBSCRIBED') {
            console.log('실시간 채널에 성공적으로 연결되었습니다! 🚀');
          }
        });

      // 마운트 후 및 상호작용 후 강제 포커스 (모바일 대응)
      inputRef.current?.focus();
      
      return () => {
        console.log("구독 해제:", roomId);
        supabase.removeChannel(channel);
      };
    };

    initChat();
  }, [roomId, supabase, router]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const content = newMessage;
    setNewMessage("");

    // 낙관적 업데이트 (최신 메시지를 가장 앞에 배치 - flex-col-reverse)
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      content: content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [optimisticMessage, ...prev]);

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: currentUser.id,
      content: content,
    });

    if (error) {
      console.error("메시지 전송 실패:", error);
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
      alert("메시지를 보낼 수 없습니다.");
    }
  };

  if (!roomInfo) return <div className="p-10 text-center">채팅방을 불러오는 중... 🍑</div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center px-4 h-14 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="flex-1 text-center truncate px-4">
          <h1 className="font-bold text-[16px] text-gray-900">
            {currentUser?.id === roomInfo.seller_id ? "구매자님과 대화" : "판매자님과 대화"}
          </h1>
        </div>
        <div className="w-8" />
      </header>

      {/* 상품 정보 바 (헤더 아래 고정) */}
      <Link 
        href={`/item/${roomInfo.item.id}`}
        className="fixed top-14 left-0 right-0 bg-white/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 flex items-center gap-3 z-40"
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
          <Image src={roomInfo.item.image_url} alt={roomInfo.item.title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900 truncate">{roomInfo.item.title}</p>
          <p className="text-[12px] text-peach-dark font-bold">${roomInfo.item.price.toLocaleString()}</p>
        </div>
        <div className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">거래중</div>
      </Link>

      {/* 메시지 리스트 - flex-col-reverse (카톡 스타일 완벽 구현) */}
      <main className="flex-1 overflow-y-auto px-4 pt-32 pb-6 flex flex-col-reverse space-y-4 space-y-reverse">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] ${
                  isMe
                    ? "bg-peach-dark text-white rounded-br-none shadow-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${isMe ? "text-white/80 text-right" : "text-gray-500"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* 입력창 - 최하단 고정 및 애니메이션 */}
      <footer className="bg-white border-t border-gray-100 p-3 pb-safe">
        <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="p-2">
             <span className="text-xl animate-peach-pulse inline-block">🍑</span>
          </div>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              className="w-full bg-gray-50 rounded-full px-5 py-3 text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-peach-dark focus:bg-white transition-all shadow-inner"
              placeholder="피치 메이트에게 메시지를 보내세요"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            {!newMessage && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-peach-dark opacity-40 pointer-events-none animate-bounce">
                ✨
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-peach-dark text-white w-10 h-10 rounded-full flex items-center justify-center disabled:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-peach-dark/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rotate-45 -translate-y-0.5 -translate-x-0.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}

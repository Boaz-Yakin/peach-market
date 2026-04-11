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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // 3. 기존 메시지 불러오기
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs);

      // 4. 실시간 메시지 수신 설정
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
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initChat();
  }, [roomId, supabase, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const content = newMessage;
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: currentUser.id,
      content: content,
    });

    if (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지를 보낼 수 없습니다.");
    }
  };

  if (!roomInfo) return <div className="p-10 text-center">채팅방을 불러오는 중... 🍑</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 flex items-center px-4 h-14 shadow-sm pt-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="flex-1 text-center font-bold text-[17px] text-gray-900 truncate px-4">
          {currentUser?.id === roomInfo.seller_id ? "구매자" : "판매자"}와 채팅
        </h1>
        <div className="w-8" />
      </header>

      {/* 상품 간이 정보 */}
      <Link 
        href={`/item/${roomInfo.item.id}`}
        className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors"
      >
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <Image src={roomInfo.item.image_url} alt={roomInfo.item.title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-gray-900 truncate">{roomInfo.item.title}</p>
          <p className="text-[13px] text-gray-500">${roomInfo.item.price.toLocaleString()}</p>
        </div>
        <div className="text-[12px] font-bold text-[#ff6b6b] border border-[#ff6b6b] px-2.5 py-1 rounded-md">
          거래 중
        </div>
      </Link>

      {/* 메시지 리스트 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] ${
                  isMe
                    ? "bg-[#ff6b6b] text-white rounded-br-none shadow-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${isMe ? "text-white/90 text-right font-medium" : "text-gray-500 font-medium"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* 입력창 */}
      <footer className="bg-white border-t border-gray-200 p-3 pb-safe">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button type="button" className="p-2 text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <input
            type="text"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
            placeholder="메시지를 입력하세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="text-[#ff6b6b] p-2 disabled:opacity-30 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}

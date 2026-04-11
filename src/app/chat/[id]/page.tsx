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
  
  // Supabase 클라이언트를 한 번만 생성하도록 고정 (리렌더링 시 구독 끊김 방지)
  const [supabase] = useState(() => createClient());
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null); // 실시간 리스너용 ref
  const [isConnected, setIsConnected] = useState(false);
  const [debugStatus, setDebugStatus] = useState("초기화 중...");
  const inputRef = useRef<HTMLInputElement>(null);

  // 채팅방 메뉴 및 기능 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 환경변수 체크용
  const hasEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[0].split("//")[1] || "알 수 없음";

  // 1. 방 정보 및 사용자 초기화
  useEffect(() => {
    if (!hasEnv) {
      setDebugStatus("에러: Supabase 환경변수 누락!");
      return;
    }

    const initData = async () => {
      try {
        setDebugStatus("사용자 확인 중...");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setDebugStatus(`인증 오류: ${authError?.message || "로그인 필요"}`);
          // router.push("/profile");
          return;
        }
        
        setCurrentUser(user);
        currentUserRef.current = user;

        setDebugStatus("방 정보 불러오는 중...");
        const { data: room } = await supabase
          .from("chat_rooms")
          .select(`id, seller_id, buyer_id, item:items (id, title, price, image_url)`)
          .eq("id", roomId)
          .single();

        if (room) setRoomInfo(room as unknown as ChatRoom);

        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });

        if (msgs) setMessages(msgs);
        setDebugStatus("구독 준비됨");
      } catch (err: any) {
        setDebugStatus(`초기화 실패: ${err.message}`);
      }
    };

    initData();
  }, [roomId, supabase, router, hasEnv]);

  // 2. 실시간 구독 및 무적의 하이브리드 폴링 (어떤 상황에서도 채팅이 작동하도록 보장)
  useEffect(() => {
    if (!roomId) return;

    setDebugStatus("채널 접속중...");
    
    // [A] Supabase 실시간 웹소켓 구독
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
          const incoming = payload.new as Message;
          
          // 내 메시지는 낙관적 업데이트로 처리했으므로 무시 (중복 방지 - 클로저 문제 해결)
          const myId = currentUserRef.current?.id;
          if (myId && incoming.sender_id === myId) return;

          setMessages((prev) => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe((status, err) => {
        setDebugStatus(`${status}`);
        setIsConnected(status === "SUBSCRIBED");
      });

    // [B] 안전망 1: 정기적 폴링 (웹소켓 실패, 모바일 네트워크 끊김 대비)
    // 3초마다 조용히 최신 데이터를 가져옴 (실시간이 안 되어도 대화 가능)
    const fetchLatestMessages = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      if (msgs) setMessages(msgs);
    };

    const pollInterval = setInterval(() => {
      // 이미 구독에 확실히 성공한 상태라면 굳이 폴링하지 않음 (서버 부하 감소)
      // 단, 디버깅을 위해 일단 무조건 실행해 볼 수도 있습니다.
      fetchLatestMessages();
    }, 3000);

    // [C] 안전망 2: 폰 화면 켰을 때 / 브라우저 탭 돌아왔을 때 즉시 동기화
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setDebugStatus("화면 복귀 갱신");
        fetchLatestMessages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, supabase]);

  // 3. 포커스 관리
  useEffect(() => {
    if (roomInfo) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [roomInfo]);

  // 4. 채팅방 메뉴 기능
  const handleLeaveRoom = async () => {
    if (!currentUser || !roomInfo) return;
    const isSeller = currentUser.id === roomInfo.seller_id;
    const updateColumn = isSeller ? "is_seller_left" : "is_buyer_left";

    // DB 업데이트
    await supabase.from("chat_rooms").update({ [updateColumn]: true }).eq("id", roomId);
    router.replace("/chat");
  };

  const handleCompleteTransaction = async () => {
    if (!currentUser || !roomInfo) return;
    
    // 실제로는 items.status 업데이트가 필요
    // await supabase.from("items").update({ status: "sold_out" }).eq("id", roomInfo.item.id);
    
    setIsMenuOpen(false);
    setShowReviewModal(true);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const content = newMessage;
    setNewMessage("");

    // 낙관적 업데이트
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
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
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
      alert("메시지를 전송하지 못했습니다.");
    } else {
      // 메시지 전송 성공 시 => 만약 상대방이 "채팅방 나가기"를 했었더라도 다시 방을 강제 소환!
      await supabase
        .from("chat_rooms")
        .update({ is_seller_left: false, is_buyer_left: false })
        .eq("id", roomId);
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
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[16px] text-gray-900 truncate">
                {currentUser?.id === roomInfo.seller_id ? "구매자님" : "판매자님"}
              </h1>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              {debugStatus} | {projectUrl} | {currentUser?.id?.slice(0, 5)}
            </span>
          </div>
        <div className="w-8 flex items-center justify-end">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-gray-800 transition-opacity hover:opacity-70">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
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
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none animate-bounce text-lg drop-shadow-sm">
                ✨
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-peach-dark text-white w-10 h-10 rounded-full flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-500 transition-all active:scale-95 shadow-lg shadow-peach-dark/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rotate-45 -translate-y-0.5 -translate-x-0.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </footer>

      {/* 옵션 메뉴 (Bottom Sheet) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl pb-8 safe-area-inset-bottom z-10 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
            <div className="px-6 py-4 space-y-4 text-[16px] font-bold text-gray-900">
              {currentUser?.id === roomInfo.seller_id && (
                <button
                  onClick={handleCompleteTransaction}
                  className="w-full text-left py-3 text-peach-dark flex items-center gap-3 transition-colors hover:bg-red-50 rounded-lg px-2 -mx-2"
                >
                  <span className="text-xl">🤝</span> 거래 완료하기
                </button>
              )}
              <button
                onClick={() => {
                  alert("신고가 접수되었습니다.");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 rounded-lg px-2 -mx-2"
              >
                <span className="text-xl">🚨</span> 신고 / 차단하기
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full text-left py-3 text-red-500 flex items-center gap-3 transition-colors hover:bg-red-50 rounded-lg px-2 -mx-2"
              >
                <span className="text-xl">🚪</span> 채팅방 나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 피치 브릭스(리뷰) 평가 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 animate-in zoom-in duration-300 flex flex-col items-center text-center">
            <div className="text-6xl mb-4 animate-bounce mt-2">🍑</div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">달콤한 거래였나요?</h2>
            <p className="text-[14px] text-gray-500 mb-6">
              상대방의 매너를 평가해주세요.<br />피치 브릭스는 피치마켓의 핵심 신뢰 자산입니다.
            </p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => { alert('최고예요 평가 완료!'); setShowReviewModal(false); router.replace("/chat"); }}
                className="flex-1 py-3 bg-peach-dark text-white rounded-xl font-bold text-[15px] hover:bg-red-500 transition-colors"
              >
                최고예요! 👍
              </button>
            </div>
            <button 
              onClick={() => { setShowReviewModal(false); router.replace("/chat"); }}
              className="mt-4 text-[13px] text-gray-400 font-medium hover:text-gray-600"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

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

        if (msgs) {
          setMessages(msgs);
          
          // 방에 처음 진입했을 때 상대방 메시지 읽음 처리
          if (user) {
            await supabase.from("messages")
              .update({ is_read: true })
              .eq("room_id", roomId)
              .neq("sender_id", user.id)
              .eq("is_read", false);
          }
        }
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

          // 방을 보고 있는 도중에 메시지가 오면 즉시 '읽음' 처리
          if (myId && incoming.sender_id !== myId && document.visibilityState === "visible") {
            supabase.from("messages").update({ is_read: true }).eq("id", incoming.id).then();
          }
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
        
      if (msgs) {
        setMessages(msgs);
        
        // 상대방이 보낸(내가 받지 않은) 메시지 중 안 읽은 것들을 '읽음' 처리
        if (currentUser?.id) {
          await supabase.from("messages")
            .update({ is_read: true })
            .eq("room_id", roomId)
            .neq("sender_id", currentUser.id)
            .eq("is_read", false);
        }
      }
    };

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLatestMessages();
      }
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
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, supabase, currentUser?.id]);

  // 3. 포커스 관리 및 자동 스크롤 관리
  useEffect(() => {
    if (roomInfo) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [roomInfo]);

  // 새 메시지가 추가될 때마다 네이티브 스크롤을 최하단으로 유지
  useEffect(() => {
    // 0.1초 뒤에 스크롤을 이동하여 렌더링 후의 높이를 완벽하게 감지
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, [messages]);

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
    <div className="flex flex-col min-h-[100dvh] bg-surface-container-low">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 glass flex items-center justify-between px-4 h-14 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-foreground btn-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-[17px] text-foreground truncate font-display">
                {currentUser?.id === roomInfo.seller_id ? "구매자님" : "판매자님"}
              </h1>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(159,65,34,0.5)]" : "bg-foreground/20"}`} />
            </div>
          </div>
        <div className="w-8 flex items-center justify-end">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-foreground btn-soft">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* 상품 정보 바 (헤더 아래 고정) - Tonal Layering 적용 */}
      <Link 
        href={`/item/${roomInfo.item.id}`}
        className="sticky top-14 z-40 bg-surface-container-low/95 backdrop-blur-sm px-5 py-3 border-b border-surface-container-high flex items-center gap-4"
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-highest shadow-sm">
          <Image src={roomInfo.item.image_url} alt={roomInfo.item.title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-foreground truncate font-display">{roomInfo.item.title}</p>
          <p className="text-[13px] text-primary font-black mt-0.5">${roomInfo.item.price.toLocaleString()}</p>
        </div>
        <div className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">거래중</div>
      </Link>

      {/* 메시지 리스트 */}
      <main className="flex-1 flex flex-col-reverse px-4 py-6 space-y-6 space-y-reverse">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          const isLocation = msg.content.startsWith("[LOCATION]");
          
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-5 py-3 rounded-[24px] text-[15px] font-medium transition-all shadow-sm ${
                  isMe
                    ? "bg-primary text-white rounded-br-none shadow-primary/10"
                    : "bg-surface-container-lowest text-foreground rounded-bl-none shadow-black/5 border border-surface-container-high/50"
                }`}
              >
                {isLocation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">📍</span>
                      <span className="font-black font-display">약속 장소 공유</span>
                    </div>
                    <div className="w-full h-40 bg-surface-container-high rounded-xl relative overflow-hidden shadow-sm">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy" 
                        allowFullScreen 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(msg.content.replace("[LOCATION]", "").trim())}&t=m&z=15&output=embed`}
                      ></iframe>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className="text-[13px] opacity-90 leading-snug font-medium truncate flex-1">
                        {msg.content.replace("[LOCATION]", "").trim()}
                      </p>
                      <a 
                        href={`https://maps.google.com/maps?q=${encodeURIComponent(msg.content.replace("[LOCATION]", "").trim())}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full flex-shrink-0 transition-colors hover:bg-primary/20"
                      >
                        지도 앱으로 열기
                      </a>
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
                <div className={`text-[10px] mt-2 font-bold tracking-tighter ${isMe ? "text-white/60 text-right" : "text-foreground/30"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* 입력창 */}
      <footer className="sticky bottom-0 z-50 bg-surface-container-low border-t border-surface-container-high p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)] transition-all">
        <form onSubmit={sendMessage} className="flex items-center gap-3 max-w-2xl mx-auto">
          <button 
            type="button"
            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
            className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center transition-all btn-soft ${isAttachmentMenuOpen ? "bg-primary text-white rotate-45" : "bg-surface-container-highest text-foreground/40 hover:text-primary"}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              className="w-full bg-surface-container-lowest border-2 border-transparent rounded-2xl px-5 py-3.5 text-[15px] text-foreground font-medium focus:outline-none focus:border-primary/20 transition-all shadow-inner"
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center disabled:bg-surface-container-high disabled:text-foreground/20 transition-all active:scale-90 shadow-lg shadow-primary/25 btn-soft"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-45 -translate-y-0.5 -translate-x-0.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>

        {/* 첨부 메뉴 패널 */}
        <div className={`overflow-hidden transition-all duration-300 max-w-2xl mx-auto ${isAttachmentMenuOpen ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
          <div className="flex items-center gap-6 pt-2 pb-2 px-2">
            <button 
              type="button"
              onClick={() => {
                setIsAttachmentMenuOpen(false);
                setTimeout(() => {
                  const loc = prompt("공유할 장소 이름을 입력하세요 (예: H mart Duluth)");
                  if (loc) {
                    setNewMessage(`[LOCATION] ${loc}`);
                  }
                }, 300);
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-surface-container-highest group-active:scale-95 rounded-full flex items-center justify-center text-2xl shadow-sm transition-transform">
                📍
              </div>
              <span className="text-[12px] font-bold text-foreground/70 tracking-tight">장소 공유</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                alert("사진 전송 기능은 준비 중입니다! 🙇‍♂️");
                setIsAttachmentMenuOpen(false);
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 bg-surface-container-highest group-active:scale-95 rounded-full flex items-center justify-center text-2xl shadow-sm transition-transform">
                📷
              </div>
              <span className="text-[12px] font-bold text-foreground/70 tracking-tight">사진 전송</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 옵션 메뉴 (Bottom Sheet) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-t-[40px] shadow-2xl pb-12 safe-area-inset-bottom z-10 animate-in slide-in-from-bottom duration-500 transition-all">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto my-4" />
            <div className="px-8 py-4 space-y-6">
              {currentUser?.id === roomInfo.seller_id && (
                <button
                  onClick={handleCompleteTransaction}
                  className="w-full text-left py-4 text-primary flex items-center gap-4 transition-all hover:translate-x-1"
                >
                  <span className="text-2xl">🤝</span> 
                  <div>
                    <p className="text-[17px] font-black font-display tracking-tight">거래 완료하기</p>
                    <p className="text-[12px] opacity-60 font-medium">상대방에게 최고예요! 평가를 보냅니다.</p>
                  </div>
                </button>
              )}
              <button
                onClick={() => {
                  alert("신고/차단은 관리자에게 전송됩니다.");
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-4 flex items-center gap-4 transition-all hover:translate-x-1"
              >
                <span className="text-2xl">🚨</span>
                <p className="text-[17px] font-black font-display tracking-tight text-foreground">신고 / 차단하기</p>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full text-left py-4 flex items-center gap-4 transition-all hover:translate-x-1"
              >
                <span className="text-2xl">🚪</span>
                <p className="text-[17px] font-black font-display tracking-tight text-red-500">채팅방 나가기</p>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 피치 브릭스(리뷰) 평가 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-xl" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-surface-container-lowest rounded-[40px] shadow-2xl p-8 w-full max-w-sm z-10 animate-in zoom-in duration-500 flex flex-col items-center text-center">
            <div className="text-7xl mb-6 animate-bounce mt-4">🍑</div>
            <h2 className="text-[24px] font-black text-foreground mb-4 font-display leading-tight">달콤한 거래였나요?</h2>
            <p className="text-[14px] text-foreground/50 mb-8 font-medium leading-relaxed">
              상대방의 매너를 평가해주세요.<br />피치 브릭스는 우리 동네를 더 따뜻하게 만드는<br />핵심 신뢰 자산입니다.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href={`/review/${roomInfo.item.id}?roomId=${roomInfo.id}`}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[16px] shadow-xl shadow-primary/30 btn-soft flex items-center justify-center"
              >
                상세 평가하러 가기 👍
              </Link>
              <button 
                onClick={() => {
                  setShowReviewModal(false);
                  router.replace("/chat");
                }}
                className="w-full py-4 bg-surface-container-high text-foreground/40 rounded-2xl font-bold text-[14px] hover:text-foreground transition-colors"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabaseBrowser";

interface ChatButtonProps {
  itemId: string;
  sellerId: string;
  buyerId: string | undefined;
}

export default function ChatButton({ itemId, sellerId, buyerId }: ChatButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleChatStart = async () => {
    if (!buyerId) {
      alert("채팅을 하시려면 먼저 로그인이 필요합니다! 😊");
      router.push("/profile");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. 이미 존재하는 채팅방이 있는지 확인
      const { data: existingRoom, error: fetchError } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("item_id", itemId)
        .eq("buyer_id", buyerId)
        .single();

      if (existingRoom) {
        // 이미 방이 있다면 그 방으로 이동
        router.push(`/chat/${existingRoom.id}`);
        return;
      }

      // 2. 방이 없다면 새로 생성
      const { data: newRoom, error: createError } = await supabase
        .from("chat_rooms")
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          seller_id: sellerId,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 3. 생성된 방으로 이동
      router.push(`/chat/${newRoom.id}`);
    } catch (error: any) {
      console.error("채팅방 생성 에러:", error);
      alert("채팅방을 열 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleChatStart}
      disabled={isLoading}
      className="bg-[#ff6b6b] text-white font-bold text-[16px] px-8 py-3.5 rounded-xl shadow-lg shadow-[#ff6b6b]/30 hover:bg-[#ff5252] active:scale-95 transition-all flex items-center gap-2 group"
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          채팅하기
          <span className="text-[18px] group-hover:translate-x-1 transition-transform">💬</span>
        </>
      )}
    </button>
  );
}

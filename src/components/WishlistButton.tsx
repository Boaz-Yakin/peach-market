"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseBrowser";

export default function WishlistButton({ itemId }: { itemId: string }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("item_id", itemId)
        .eq("user_id", user.id)
        .single();

      if (data) setIsWishlisted(true);
      setIsLoading(false);
    };

    checkWishlist();
  }, [itemId, supabase]);

  const toggleWishlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요한 기능입니다. 🍑");
      return;
    }

    if (isWishlisted) {
      // 찜 해제
      setIsWishlisted(false);
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);
      
      if (error) {
        console.error(error);
        setIsWishlisted(true);
      }
    } else {
      // 찜 하기
      setIsWishlisted(true);
      const { error } = await supabase
        .from("wishlists")
        .insert({
          item_id: itemId,
          user_id: user.id
        });

      if (error) {
        console.error(error);
        setIsWishlisted(false);
      }
    }
  };

  if (isLoading) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={toggleWishlist}
      className={`flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-90 ${
        isWishlisted ? "text-[#ff6b6b]" : "text-gray-400 hover:text-[#ff6b6b]"
      }`}
      aria-label="찜하기"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill={isWishlisted ? "#ff6b6b" : "none"}
        stroke={isWishlisted ? "#ff6b6b" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span className="text-[13px] font-medium">
        {isWishlisted ? "찜완료 ✓" : "찜하기"}
      </span>
    </button>
  );
}

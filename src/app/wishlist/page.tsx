"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabaseBrowser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WishItem {
  id: string;
  item: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    location: string;
    category: string;
    created_at: string;
  };
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/profile");
        return;
      }

      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          id,
          item:items (
            id,
            title,
            price,
            image_url,
            location,
            category,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("찜 목록 가져오기 에러:", error);
      } else if (data) {
        setWishlist(data as unknown as WishItem[]);
      }
      setIsLoading(false);
    };

    fetchWishlist();
  }, [supabase, router]);

  if (isLoading) return <div className="p-10 text-center">찜 목록 불러오는 중... 🍑</div>;

  return (
    <div className="bg-white min-h-screen">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center shadow-sm pt-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="text-[18px] font-bold text-gray-900 ml-2">찜한 목록</h1>
      </header>

      <main className="pb-20">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <span className="text-5xl mb-4">🧡</span>
            <p className="text-[17px] font-semibold text-gray-700">찜한 상품이 없습니다.</p>
            <p className="text-[14px] text-gray-400 mt-1">마음에 드는 상품에 하트를 눌러보세요!</p>
            <Link
              href="/"
              className="mt-6 px-5 py-2.5 bg-gray-100 text-gray-600 text-[14px] font-bold rounded-xl active:bg-gray-200 transition-colors"
            >
              물건 구경하러 가기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {wishlist.map((wish) => (
              <Link
                key={wish.id}
                href={`/item/${wish.item.id}`}
                className="flex gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-[100px] h-[100px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm">
                  <Image src={wish.item.image_url?.split(',')[0] || ''} alt={wish.item.title} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-between py-1 flex-1">
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 leading-snug truncate">
                      {wish.item.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {wish.item.location}
                    </p>
                    <div className="mt-1">
                      <span className="text-[10px] font-semibold text-[#ff6b6b] bg-[#fff0f0] px-2 py-0.5 rounded-md border border-[#ff6b6b]/20">
                        {wish.item.category}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-[16px] text-gray-900">
                    ${wish.item.price.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

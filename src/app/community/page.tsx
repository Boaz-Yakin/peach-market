import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabaseServer";
import SearchHeader from "@/components/SearchHeader";
import BottomNav from "@/components/BottomNav";

export const dynamic = 'force-dynamic';

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "전체" } = await searchParams;
  
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(*), comments(count)")
    .order("created_at", { ascending: false });

  if (category !== "전체") {
    query = query.eq("category", category);
  }
  
  // 만약 에러가 난다면 posts 테이블이 아직 없어서 발생하는 것이므로 대비를 해둡니다.
  const { data: postsData, error } = await query;
  const posts: any[] = error ? [] : (postsData || []);

  const categories = ["전체", "맛집", "동네생활", "분실물", "취미/모임"];

  return (
    <main className="min-h-screen bg-surface-container-low">
      <Suspense fallback={<div className="h-14 bg-surface" />}>
        <SearchHeader />
      </Suspense>

      {/* Community Categories Bar */}
      <div className="sticky top-14 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 scrollbar-hide overflow-x-auto">
        <div className="flex px-4 py-3 gap-2 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/community?category=${cat}`}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                category === cat
                  ? "bg-[#ff6b6b] text-white shadow-md shadow-[#ff6b6b]/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts List or Empty State */}
      {posts.length === 0 ? (
        <div className="px-6 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">💬</span>
          </div>
          <h2 className="text-[20px] font-black text-gray-900 mb-2">
            아직 올라온 글이 없어요!
          </h2>
          <p className="text-[15px] text-gray-500 font-medium leading-relaxed max-w-[280px]">
            가장 먼저 {category !== "전체" ? `[${category}]` : "동네"} 이야기를<br /> 남겨보시는 건 어떨까요?
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 pb-24">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`} className="block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex gap-2 items-center mb-2">
                <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-md">
                  {post.category}
                </span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-gray-900 font-medium line-clamp-2 leading-snug mb-2">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[12px] text-gray-400 font-medium mt-1">
                    <div className="flex items-center gap-1">
                      <span className="max-w-[80px] truncate">{post.profiles?.nickname || "익명"}</span>
                    </div>
                    <span>•</span>
                    <span>{getTimeAgo(post.created_at)}</span>
                    {(post.comments?.[0]?.count || 0) > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-[#ff6b6b]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span>{post.comments[0].count}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {post.image_url && (
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 border border-black/5 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url.split(',')[0]} alt="Post image" className="w-full h-full object-cover" />
                    {post.image_url.includes(',') && (
                      <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md rounded-md p-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Community Write FAB */}
      <div className="fixed bottom-[80px] right-0 left-0 max-w-md mx-auto pointer-events-none z-40">
        <div className="absolute right-4 bottom-0 pointer-events-auto">
          <Link href="/community/write" className="flex items-center justify-center w-14 h-14 bg-[#ff6b6b] text-white rounded-full shadow-lg shadow-[#ff6b6b]/40 hover:scale-105 active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </Link>
        </div>
      </div>
      
      <BottomNav />
    </main>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabaseServer";
import SearchHeader from "@/components/SearchHeader";

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

  // 1. 커뮤니티 게시글 가져오기 (테이블명: posts 가정)
  let query = supabase
    .from("posts")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false });

  if (category !== "전체") {
    query = query.eq("category", category);
  }

  const { data: posts } = await query;

  const categories = ["전체", "맛집", "동네생활", "분실물", "취미/모임"];

  return (
    <main className="min-h-screen bg-surface-container-low">
      <Suspense fallback={<div className="h-14 bg-surface" />}>
        <SearchHeader />
      </Suspense>

      {/* Community Categories Bar */}
      <div className="sticky top-14 z-30 glass scrollbar-hide overflow-x-auto">
        <div className="flex px-4 py-3 gap-2 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/community?category=${cat}`}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                category === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-container-high text-foreground/50 hover:bg-surface-container-highest"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Editorial Community Feed */}
      <div className="px-4 py-4 space-y-4 pb-24">
        {(!posts || posts.length === 0) ? (
          <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-[18px] font-black text-foreground font-display mb-2">피치 광장이 조용하네요</h3>
            <p className="text-[14px] text-foreground/40 font-medium">우리 동네의 첫 소식을 전해보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block bg-surface-container-lowest rounded-3xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {post.category}
                </span>
                <span className="text-[12px] text-foreground/30 font-medium tracking-tight">
                  {post.profiles?.display_name || "익명"} • {getTimeAgo(post.created_at)}
                </span>
              </div>
              
              <h4 className="text-[18px] font-black text-foreground leading-snug mb-2 font-display group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <p className="text-[14px] text-foreground/60 leading-relaxed line-clamp-2 mb-4 font-medium">
                {post.content}
              </p>

              {post.image_url && (
                <div className="w-full h-48 relative rounded-2xl overflow-hidden mb-4 bg-surface-container-high">
                  <Image src={post.image_url} alt="Post" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-surface-container-low">
                <div className="flex items-center gap-1.5 text-foreground/40 text-[12px] font-bold">
                  <span>🚀</span> 0
                </div>
                <div className="flex items-center gap-1.5 text-foreground/40 text-[12px] font-bold">
                  <span>💬</span> 0
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Community Write FAB */}
      <div className="fixed bottom-20 right-0 left-0 max-w-md mx-auto pointer-events-none z-40">
        <div className="absolute right-4 bottom-0 pointer-events-auto">
          <Link href="/community/write" className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-full shadow-2xl shadow-primary/40 btn-soft">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-black font-display pr-1">글쓰기</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

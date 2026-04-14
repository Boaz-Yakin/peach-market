import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import Image from "next/image";

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

export default async function CommunityDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();

  // Fetch Post
  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !post) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          ⚠️
        </div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">게시글을 찾을 수 없습니다</h2>
        <Link href="/community" className="text-[#ff6b6b] font-medium mt-4">목록으로 돌아가기</Link>
      </div>
    );
  }

  // Fetch Comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(*)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const imageUrls = post.image_url ? post.image_url.split(',') : [];

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-4 h-14 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 w-full max-w-md mx-auto">
        <Link href="/community" className="p-2 -ml-2 text-gray-800">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="text-[17px] font-bold text-gray-900 tracking-tight flex-1 text-center pr-8">피치 광장</h1>
      </header>

      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full">
        {/* Author Info */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {post.profiles?.avatar_url ? (
              <Image src={post.profiles.avatar_url} alt="profile" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-sm">
                 {post.profiles?.nickname?.charAt(0) || "?"}
               </div>
            )}
          </div>
          <div>
            <div className="font-bold text-[15px] text-gray-900">{post.profiles?.nickname || "익명"}</div>
            <div className="text-[12px] text-gray-400 font-medium">{post.profiles?.location || "지역 미상"} • {getTimeAgo(post.created_at)}</div>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <div className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-[12px] font-bold rounded-[8px] mb-3">
            {post.category}
          </div>
          <p className="text-[16px] text-gray-900 leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </p>

          {/* Post Images (Swipe Gallery) */}
          {imageUrls.length > 0 && (
            <div className="relative mb-6">
              <div className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-2">
                {imageUrls.map((url: string, index: number) => (
                  <div key={index} className="flex-none w-full sm:w-[90%] snap-center relative rounded-xl overflow-hidden border border-black/5 aspect-[4/3]">
                    <Image src={url} alt={`Post Image ${index + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
              {imageUrls.length > 1 && (
                <div className="absolute top-2 right-6 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-full pointer-events-none shadow-sm">
                  1 / {imageUrls.length} 👉
                </div>
              )}
            </div>
          )}

          {/* Action Counts */}
          <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500 py-3 border-y border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">💬</span>
              <span>댓글 {comments?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-4 pb-24">
          {(!comments || comments.length === 0) ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-gray-400 font-medium">제일 먼저 따뜻한 댓글을 남겨주세요!</p>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <Image src={comment.profiles.avatar_url} alt="profile" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-[10px]">
                        {comment.profiles?.nickname?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[14px] text-gray-900">{comment.profiles?.nickname || "익명"}</span>
                      <span className="text-[11px] text-gray-400">{getTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-[14px] text-gray-800 leading-snug">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Comment Input */}
      <CommentInput postId={id} />
    </div>
  );
}

// Client Component for Comment Input
import CommentInput from "./CommentInput";

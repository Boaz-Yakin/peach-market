"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import { compressImage } from "@/lib/imageUtils";

const CATEGORIES = ["동네생활", "맛집", "분실물", "취미/모임"];

export default function CommunityEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("동네생활");
  const [content, setContent] = useState("");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미지 상태 관리
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 현재 사용자 확인 및 기존 게시글 불러오기
  useEffect(() => {
    const checkUserAndFetchPost = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch existing post
        const { data: post } = await supabase.from("posts").select("*").eq("id", id).single();
        if (post) {
          if (post.user_id !== user.id) {
            alert("수정 권한이 없습니다.");
            router.push("/community");
            return;
          }
          setContent(post.content);
          setCategory(post.category);
          if (post.image_url) {
            const urls = post.image_url.split(',');
            setPreviewUrls(urls);
            setExistingUrls(urls);
          }
        }
      } else {
        router.push("/profile");
      }
    };
    if (id) {
      checkUserAndFetchPost();
    }
  }, [id, supabase, router]);

  const isFormValid = content.trim() !== "" && category !== "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 5) {
        alert("사진은 최대 5장까지 업로드할 수 있습니다.");
        return;
      }
      setSelectedFiles((prev) => [...prev, ...files]);
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...urls]);
    }
  };

  const removeImage = (index: number) => {
    const totalPreviewCount = previewUrls.length;
    // index가 existingUrl 안에 있는지 판단 로직 단순화
    // 그냥 previewUrls 배열을 기준으로 제거
    setPreviewUrls((prev) => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      
      // existingUrls도 갱신 (만약 존재하는 URL 이었다면)
      setExistingUrls(prevExisting => prevExisting.filter(url => newUrls.includes(url)));
      
      return newUrls;
    });

    // 선택된 파일(새 파일) 중에서도 인덱스에 해당하는 것을 찾아 지워야 할 수도 있지만
    // existing이 섞여있어서 복잡하므로 간단히 전체 리셋 로직으로 구현하는 편이 좋으나
    // 단순히 새 이미지들 중 제거
    const existingCount = existingUrls.length;
    if (index >= existingCount) {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== (index - existingCount)));
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. 이미지 업로드 (새 파일만)
      let finalImageUrls = [...existingUrls];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // 이미지 초경량 압축 (Vanguard Alliance 방식 적용)
          const compressedFile = await compressImage(file);

          const fileExt = compressedFile.name.split('.').pop();
          const fileName = `community_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(filePath, compressedFile);

          if (uploadError) {
            throw new Error(`이미지 업로드에 실패했습니다: ${file.name}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);
          
          finalImageUrls.push(publicUrl);
        }
      }

      // 2. DB 업데이트
      const { error: updateError } = await supabase.from("posts").update({
        content: content.trim(),
        category: category,
        image_url: finalImageUrls.length > 0 ? finalImageUrls.join(',') : null,
      }).eq("id", id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 성공 시 커뮤니티 피드로 이동
      router.push("/community");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[100dvh] bg-white">
        {/* Header */}
        <header className="flex justify-between items-center px-4 h-14 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-800 transition-opacity hover:opacity-70"
            aria-label="뒤로 가기"
            disabled={isLoading}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">동네생활 글수정</h1>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`font-semibold text-[16px] transition-colors duration-200 min-w-[48px] flex items-center justify-center ${
              isFormValid && !isLoading
                ? "text-[#ff6b6b]"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-[#ff6b6b]/30 border-t-[#ff6b6b] rounded-full animate-spin" />
            ) : (
              "완료"
            )}
          </button>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-5 py-3 text-[13px] text-red-600 font-medium animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <form className="p-5 space-y-0" onSubmit={(e) => e.preventDefault()}>
            
            {/* Category */}
            <button
              type="button"
              onClick={() => setShowCategorySheet(true)}
              className="w-full text-left py-2 mb-4 flex items-center gap-2"
            >
              <span className="text-[14px] font-bold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
                {category}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Description */}
            <div className="pt-2">
              <textarea
                placeholder="우리 동네 관련 질문이나 이야기를 나눠보세요."
                className="w-full h-80 text-[16px] outline-none placeholder:text-gray-300 resize-none py-2 leading-relaxed text-gray-900 bg-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Image Upload Area */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 pb-8">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x items-start scrollbar-hide">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                  multiple
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="snap-start flex-shrink-0 w-[60px] h-[60px] border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 active:bg-gray-50 transition-all"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="text-[10px] font-semibold">{selectedFiles.length}/5</span>
                </button>

                {previewUrls.map((url, index) => (
                  <div key={url} className="relative snap-start flex-shrink-0 w-[60px] h-[60px] rounded-xl overflow-hidden border border-black/5 shadow-sm group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
          </form>
        </main>
      </div>

      {/* Category Bottom Sheet */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCategorySheet(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl pb-24 safe-area-inset-bottom z-10 animate-in fade-in slide-in-from-bottom duration-300 max-w-md mx-auto w-full">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
            <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-gray-50">
              <h2 className="text-[18px] font-bold text-gray-900">주제 선택</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setShowCategorySheet(false);
                  }}
                  className={`w-full text-left px-6 py-4 text-[16px] font-medium transition-colors ${
                    category === cat
                      ? "text-[#ff6b6b] bg-red-50"
                      : "text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  {cat}
                  {category === cat && <span className="float-right text-[#ff6b6b]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

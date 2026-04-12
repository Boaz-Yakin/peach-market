"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabaseBrowser";

const CATEGORIES = [
  "📦 무빙세일",
  "🚗 중고차 안심",
  "🇰🇷 K-아이템",
  "💝 나눔/덤",
  "🛋️ 가구",
  "📱 전자기기",
  "👗 의류/패션",
  "📚 책/취미",
  "기타",
];

export default function WritePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미지 상태 관리
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 현재 사용자 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // 로그인 안 되어 있으면 로그인 유도할 수 있지만, 여기서는 일단 기록만 함
        console.warn("로그인되지 않은 상태입니다.");
      }
    };
    checkUser();
  }, [supabase]);

  const isFormValid =
    title.trim() !== "" &&
    description.trim() !== "" &&
    location.trim() !== "" &&
    category !== "" &&
    selectedFile !== null; // 사진 필수

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. 이미지 업로드 (Supabase Storage: 'item-images' 버킷 필수)
      let finalImageUrl = "";
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error("이미지 업로드에 실패했습니다. (버킷 확인 필요)");
        }

        // 이미지 공용 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // 2. DB 저장
      const { error: insertError } = await supabase.from("items").insert({
        title: title.trim(),
        price: price.trim() || "가격 협의",
        location: location.trim(),
        category: category,
        description: description.trim(),
        image_url: finalImageUrl,
        user_id: userId, // 추가된 컬럼
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 성공 시 메인 피드로 이동
      router.push("/");
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
          <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">내 물건 팔기</h1>
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

            {/* Image Upload Area */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 snap-x border-b border-gray-100 items-start">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="snap-start flex-shrink-0 w-[80px] h-[80px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 active:bg-gray-100 transition-all hover:border-[#ff6b6b]/30"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5 text-gray-300">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span className="text-[11px] font-semibold text-gray-400">{selectedFile ? "1/10" : "0/10"}</span>
              </button>

              {previewUrl && (
                <div className="relative snap-start flex-shrink-0 w-[80px] h-[80px] rounded-2xl overflow-hidden border border-black/5 shadow-sm group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {setSelectedFile(null); setPreviewUrl(null);}}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-0 pt-2">

              {/* Title */}
              <div className="border-b border-gray-100 py-4 focus-within:border-[#ff6b6b] transition-colors duration-300">
                <input
                  type="text"
                  placeholder="제목 *"
                  className="w-full text-[18px] outline-none placeholder:text-gray-300 font-bold text-gray-900 bg-transparent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Category */}
              <button
                type="button"
                onClick={() => setShowCategorySheet(true)}
                className="w-full text-left border-b border-gray-100 py-4 flex justify-between items-center active:bg-gray-50 transition-colors group"
              >
                <span className={`text-[16px] font-medium ${category ? "text-gray-900" : "text-gray-300"}`}>
                  {category || "카테고리 선택 *"}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              {/* Price */}
              <div className="border-b border-gray-100 py-4 flex items-center focus-within:border-[#ff6b6b] transition-colors duration-300 relative">
                <span className="text-gray-900 absolute left-0 text-[17px] font-bold">$</span>
                <input
                  type="number"
                  placeholder="가격 (미입력 시 '가격 협의')"
                  className="w-full text-[17px] outline-none placeholder:text-gray-300 bg-transparent pl-5 font-bold text-gray-900"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="border-b border-gray-100 py-4 flex items-center gap-2 focus-within:border-[#ff6b6b] transition-colors duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="거래 희망 장소 * (예: Johns Creek HMART)"
                  className="w-full text-[16px] outline-none placeholder:text-gray-300 bg-transparent font-medium text-gray-900"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="pt-4">
                <textarea
                  placeholder={`게시글 내용을 작성해주세요. (판매 금지 품목은 게시가 제한될 수 있어요) *\n\n예시:\n- 구매 연도/시기\n- 브랜드/모델명\n- 사용감 및 하자 유무`}
                  className="w-full h-64 text-[16px] outline-none placeholder:text-gray-300 resize-none py-2 leading-relaxed text-gray-900 bg-transparent"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

            </div>
          </form>
        </main>
      </div>

      {/* Category Bottom Sheet */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCategorySheet(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl pb-8 safe-area-inset-bottom z-10 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" />
            <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-gray-50">
              <h2 className="text-[18px] font-bold text-gray-900">카테고리 선택</h2>
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


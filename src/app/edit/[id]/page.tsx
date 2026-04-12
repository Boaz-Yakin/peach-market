"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "../../../lib/supabaseBrowser";
import Image from "next/image";

const CATEGORIES = [
  "📦 무빙세일",
  "🚗 중고차 안심",
  "🇰🇷 K-푸드/직거래",
  "📱 전자제품",
  "🪵 가구/인테리어",
  "👗 의류/잡화",
  "🧸 육아/완구",
  "🎨 취미/도서",
  "✨ 기타 중고",
];

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/profile");
        return;
      }

      const { data: item, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !item) {
        alert("게시글을 불러올 수 없습니다.");
        router.push("/");
        return;
      }

      // 작성자 본인 확인
      if (item.user_id !== user.id) {
        alert("수정 권한이 없습니다.");
        router.push("/");
        return;
      }

      setTitle(item.title);
      setCategory(item.category);
      setPrice(item.price.toString());
      setLocation(item.location);
      setDescription(item.description);
      setImageUrl(item.image_url);
      setPreviewUrl(item.image_url);
      setIsLoading(false);
    };

    fetchItem();
  }, [id, supabase, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) {
      alert("필수 항목을 모두 입력해주세요!");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // 1. 새로운 사진이 선택되었다면 업로드
      if (selectedFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("로그인이 필요합니다.");

        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);
        
        finalImageUrl = urlData.publicUrl;
      }

      // 2. DB 업데이트
      const { error: updateError } = await supabase
        .from("items")
        .update({
          title,
          category,
          price: parseInt(price),
          location,
          description,
          image_url: finalImageUrl,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("성공적으로 수정되었습니다! 🍑");
      router.push(`/item/${id}`);
      router.refresh();
    } catch (error: any) {
      console.error("수정 에러:", error);
      alert("수정 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">데이터 불러오는 중... 🍑</div>;

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">게시글 수정</h1>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="text-[#ff6b6b] font-bold text-[16px] disabled:opacity-30"
        >
          {isSubmitting ? "처리중" : "완료"}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* 사진 업로드 영역 */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 shrink-0 active:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span className="text-[11px] font-bold">사진교체</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          {previewUrl && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              <div className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* 입력 필드들 */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="제목"
            className="w-full text-[16px] font-medium border-b border-gray-100 py-3 focus:outline-none focus:border-[#ff6b6b] transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="relative border-b border-gray-100 py-3">
            <select
              className="w-full appearance-none bg-white text-[15px] text-gray-800 focus:outline-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-gray-100 py-3">
            <span className="text-gray-900 font-bold">$</span>
            <input
              type="number"
              placeholder="가격 (USD)"
              className="w-full text-[15px] focus:outline-none"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <input
            type="text"
            placeholder="거래 희망 장소 (예: Duluth H-Mart)"
            className="w-full text-[15px] border-b border-gray-100 py-3 focus:outline-none focus:border-[#ff6b6b] transition-colors"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <textarea
            placeholder="게시글 내용을 작성해주세요. (판매 금지 물품은 게시가 제한될 수 있어요)"
            className="w-full text-[15px] py-3 h-48 focus:outline-none resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
}

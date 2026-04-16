"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabaseBrowser";
import { compressImage } from "../../../lib/imageUtils";

export default function ProfileEditPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form fields
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/profile");
        return;
      }
      setUser(user);
      setNickname(user.user_metadata?.display_name || user.user_metadata?.full_name || "");
      setCity(user.user_metadata?.city || "애틀란타");
      setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || "");
      setLoading(false);
    }
    getUser();
  }, [supabase, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // 이미지 초경량 압축 (Vanguard Alliance 방식 적용)
      const compressedFile = await compressImage(file);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images') // reuse existing bucket
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('이미지 업로드 실패: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 1. Auth Metadata 업데이트 (내 세션용)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: nickname,
        city: city,
        avatar_url: avatarUrl,
      }
    });

    if (authError) {
      alert("Auth 저장 실패: " + authError.message);
      setSaving(false);
      return;
    }

    // 2. Profiles 테이블 업데이트 (타인 노출용)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: nickname,
        city: city,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profiles 테이블 저장 실패:", profileError);
      // Auth는 성공했으므로 에러를 띄우되 페이지 이동은 시도할 수 있음
    }

    router.push("/profile");
    router.refresh();
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><span className="text-4xl animate-bounce">🍑</span></div>;

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-4 h-14">
        <Link href="/profile" className="p-2 -ml-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="flex-1 text-center pr-8 text-[17px] font-bold text-gray-900">프로필 수정</h1>
      </header>

      <div className="max-w-md mx-auto px-6 pt-10">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-xl overflow-hidden cursor-pointer group"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍑</div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                   <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                 </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                   <div className="w-6 h-6 border-3 border-peach-dark border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-[13px] font-bold text-peach-dark"
            >
              사진 변경하기
            </button>
          </div>

          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="text-[14px] font-black text-gray-400 ml-1 uppercase tracking-wider">피치마켓 닉네임</label>
            <input
              type="text"
              required
              placeholder="예: 조지아피치, 둘루스킹..."
              className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-[16px] border-none focus:ring-2 focus:ring-peach transition-all"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <p className="text-[12px] text-gray-400 ml-1">이웃들이 부를 이름을 정해주세요!</p>
          </div>

          {/* City Input */}
          <div className="space-y-2">
            <label className="text-[14px] font-black text-gray-400 ml-1 uppercase tracking-wider">활동 지역 (City)</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="예: Duluth, Suwanee..."
                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-[16px] border-none focus:ring-2 focus:ring-peach transition-all"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-peach-dark text-white font-black py-5 rounded-[20px] text-[17px] shadow-xl shadow-peach-dark/30 hover:bg-peach active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:shadow-none mt-10"
          >
            {saving ? "저장 중..." : "프로필 저장하기"}
          </button>

          <p className="text-center text-[13px] text-gray-400 mt-6 px-4">
             프로필 정보를 수정하면 모든 거래 게시글과<br/>채팅에서 변경된 정보가 노출됩니다. 🍑
          </p>
        </form>
      </div>
    </div>
  );
}

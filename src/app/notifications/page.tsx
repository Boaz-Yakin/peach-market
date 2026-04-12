"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabaseBrowser";

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "settings">("list");
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState({
    notif_price_drop: true,
    notif_chat: true,
    notif_keyword: true
  });
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      // Fetch Notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(notifs || []);

      // Fetch Profile Settings
      const { data: profile } = await supabase
        .from("profiles")
        .select("notif_price_drop, notif_chat, notif_keyword")
        .eq("id", user.id)
        .single();
      if (profile) setSettings(profile);

      // Fetch Keywords
      const { data: kws } = await supabase
        .from("user_keywords")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setKeywords(kws || []);

      setLoading(false);
    }
    fetchData();
  }, [supabase, router]);

  const toggleSetting = async (key: keyof typeof settings) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ [key]: newVal }).eq("id", user.id);
    }
  };

  const addKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("user_keywords")
        .insert({ user_id: user.id, keyword: newKeyword.trim() })
        .select()
        .single();
      
      if (!error && data) {
        setKeywords([data, ...keywords]);
        setNewKeyword("");
      }
    }
    setIsSaving(false);
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from("user_keywords").delete().eq("id", id);
    if (!error) {
      setKeywords(keywords.filter(k => k.id !== id));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><span className="text-4xl animate-bounce">🔔</span></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="text-[18px] font-bold text-gray-900">알림</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        <button 
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${activeTab === "list" ? "text-gray-900" : "text-gray-400"}`}
        >
          알림 목록
          {activeTab === "list" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 mx-8"></div>}
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${activeTab === "settings" ? "text-gray-900" : "text-gray-400"}`}
        >
          알림 설정
          {activeTab === "settings" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 mx-8"></div>}
        </button>
      </div>

      <main className="max-w-md mx-auto">
        {activeTab === "list" ? (
          <div className="divide-y divide-gray-100 bg-white min-h-[calc(100vh-120px)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                <span className="text-5xl mb-4">🔔</span>
                <p className="text-gray-500 font-medium">아직 도착한 알림이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-1">관심 있는 상품을 찜하고<br/>가격 하락 소식을 기다려보세요!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link key={notif.id} href={notif.link || "#"} className={`block p-5 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-peach-light/10' : ''}`}>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-peach-light/20 flex items-center justify-center flex-shrink-0 text-xl">
                      {notif.type === 'price_drop' && '📉'}
                      {notif.type === 'chat' && '💬'}
                      {notif.type === 'keyword' && '🍑'}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 leading-snug">{notif.title}</p>
                      <p className="text-[14px] text-gray-600 mt-1 line-clamp-2">{notif.content}</p>
                      <p className="text-[12px] text-gray-400 mt-2">방금 전</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="p-6 space-y-10 animate-in fade-in duration-300">
            {/* Toggles */}
            <div className="space-y-6 bg-white p-6 rounded-[24px] shadow-sm">
              <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-widest ml-1">기본 알림 설정</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-bold text-gray-800">가격 하락 알림</p>
                  <p className="text-[13px] text-gray-400">찜한 상품의 가격이 내려가면 알려드려요.</p>
                </div>
                <button 
                  onClick={() => toggleSetting("notif_price_drop")}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notif_price_drop ? 'bg-peach-dark' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notif_price_drop ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-bold text-gray-800">새 채팅 알림</p>
                  <p className="text-[13px] text-gray-400">이웃에게 메시지가 오면 알려드려요.</p>
                </div>
                <button 
                  onClick={() => toggleSetting("notif_chat")}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notif_chat ? 'bg-peach-dark' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notif_chat ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[16px] font-bold text-gray-800">키워드 루킹 알림</p>
                  <p className="text-[13px] text-gray-400">관심 키워드 상품이 등록되면 알려드려요.</p>
                </div>
                <button 
                  onClick={() => toggleSetting("notif_keyword")}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notif_keyword ? 'bg-peach-dark' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notif_keyword ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Keyword Section */}
            <div className="space-y-6 bg-white p-6 rounded-[24px] shadow-sm">
              <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-widest ml-1">키워드 루킹 관리</h3>
              
              <form onSubmit={addKeyword} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="예: 자전거, 조던, 캠핑..."
                  className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-peach transition-all"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-[14px] active:scale-95 transition-all"
                >
                  등록
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {keywords.length === 0 ? (
                  <p className="text-gray-400 text-[13px] text-center w-full py-4">등록된 키워드가 없습니다.</p>
                ) : (
                  keywords.map((kw) => (
                    <div key={kw.id} className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full group hover:bg-peach-light/20 transition-colors">
                      <span className="text-[14px] font-medium text-gray-700">{kw.keyword}</span>
                      <button 
                        onClick={() => deleteKeyword(kw.id)}
                        className="text-gray-400 hover:text-[#ff6b6b] transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[12px] text-gray-400 ml-1">최대 30개까지 등록할 수 있습니다.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

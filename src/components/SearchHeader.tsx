"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabaseBrowser";

export default function SearchHeader() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 초기 읽지 않은 알림 확인
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      if (count && count > 0) setHasUnread(true);

      // 실시간 구독
      const channel = supabase
        .channel(`public:notifications:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setHasUnread(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    setupRealtime();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
    setIsSearchOpen(false);
  };

  if (isSearchOpen) {
    return (
      <header className="sticky top-0 z-50 glass px-4 h-14 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200">
        <button onClick={() => setIsSearchOpen(false)} className="text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <form onSubmit={handleSearch} className="flex-1">
          <input
            autoFocus
            type="text"
            placeholder="상품명, 동네 등으로 검색"
            className="w-full bg-surface-container-high rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 glass flex items-center justify-between px-4 h-14">
      <h1 className="text-xl font-bold text-primary flex items-center font-display tracking-tight">
        <span className="text-2xl mr-1.5">🍑</span> 피치마켓
      </h1>
      <div className="flex gap-1">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-foreground/70 hover:text-primary transition-colors btn-soft"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <Link href="/notifications" className="p-2 text-foreground/70 hover:text-primary transition-colors relative btn-soft">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={hasUnread ? "animate-bell-shake" : ""}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {hasUnread && (
            <>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border border-white"></span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}

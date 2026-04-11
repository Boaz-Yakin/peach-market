"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

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
      <header className="sticky top-0 z-50 bg-white px-4 h-14 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-200">
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
            className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 h-14">
      <h1 className="text-xl font-bold text-[#ff6b6b] flex items-center">
        <span className="text-2xl mr-1">🍑</span> 피치마켓
      </h1>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-gray-600 hover:text-[#ff6b6b] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <button className="p-2 text-gray-600 hover:text-[#ff6b6b] transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}

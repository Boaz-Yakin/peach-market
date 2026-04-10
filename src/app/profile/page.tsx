import Link from "next/link";
import { createClient } from "../../lib/supabaseServer";
import AuthButton from "../../components/AuthButton";

export const dynamic = "force-dynamic";

function formatPrice(price: string) {
  if (!price) return "가격 협의";
  return isNaN(Number(price)) ? price : `$${Number(price).toLocaleString()}`;
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 대시보드 데이터 패칭
  let sellingCount = 0;
  let wishlistCount = 0;
  let chatCount = 0;
  let items: any[] = [];

  if (user) {
    // 1. 내가 올린 상품 리스트 및 개수
    const { data: myItems, count: sCount } = await supabase
      .from("items")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    items = myItems || [];
    sellingCount = sCount || 0;

    // 2. 찜한 개수
    const { count: wCount } = await supabase
      .from("wishlists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    wishlistCount = wCount || 0;

    // 3. 진행 중인 채팅 개수
    const { count: cCount } = await supabase
      .from("chat_rooms")
      .select("id", { count: "exact", head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    chatCount = cCount || 0;
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-50 flex items-center justify-between px-5 py-4">
        <h1 className="text-[20px] font-bold text-gray-900">마이 피치</h1>
        <button className="text-gray-400 p-1 hover:text-gray-900 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </header>

      {/* Profile Section */}
      <div className="px-5 pt-8 pb-10">
        <div className="flex flex-col items-center text-center">
          {/* Avatar with Glow Effect */}
          <div className="relative group mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b6b] to-[#ff9e7d] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-24 h-24 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-4xl">🍑</span>
              )}
            </div>
          </div>
          
          <h2 className="text-[22px] font-bold text-gray-900 flex items-center gap-1.5">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || "사용자"} 
            {user && <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>}
          </h2>
          <p className="text-[14px] text-gray-500 mt-1">
            {user ? "애틀란타 지역 • 인증 완료" : "로그인이 필요합니다"}
          </p>
          
          <div className="mt-6 w-full max-w-[200px]">
            <AuthButton user={user} />
          </div>
        </div>

        {/* Stats Dashboard Grid */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          {[
            { label: "판매내역", value: sellingCount, color: "text-gray-900" },
            { label: "찜목록", value: wishlistCount, color: "text-[#ff6b6b]" },
            { label: "진행대화", value: chatCount, color: "text-blue-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100/50">
              <span className={`text-[20px] font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-[12px] font-bold text-gray-500 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Menu List */}
      <div className="space-y-1 pb-6 px-3">
        {[
          { icon: "🛍️", label: "나의 판매 목록", href: "#items", count: sellingCount },
          { icon: "🧡", label: "관심 목록 (찜)", href: "/wishlist", count: wishlistCount },
          { icon: "💬", label: "채팅 목록", href: "/chat", count: chatCount },
          { icon: "📋", label: "나눔/무료 목록", href: "/?category=나눔/덤" },
        ].map((menu) => (
          <Link
            key={menu.label}
            href={menu.href}
            className="flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl w-8 text-center">{menu.icon}</span>
              <span className="text-[16px] font-bold text-gray-800">{menu.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {menu.count !== undefined && (
                <span className="text-[13px] font-medium text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {menu.count}
                </span>
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* My Listings Dashboard */}
      <div id="items" className="pt-4 pb-20 border-t-8 border-gray-50">
        <div className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-gray-900">최근 나의 판매글</h3>
            <span className="bg-[#ff6b6b]/10 text-[#ff6b6b] text-[11px] font-heavy px-2 py-0.5 rounded-md">LIVE</span>
          </div>
          <Link href="/write" className="text-[13px] font-bold text-[#ff6b6b]">새 글 쓰기 ➔</Link>
        </div>

        {!user ? (
          <div className="px-5 py-12 text-center text-gray-400">
             로그인하면 대표님의 명품 물건들을 한눈에 관리할 수 있습니다! 🍑
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center space-y-4">
            <div className="text-4xl opacity-50">📦</div>
            <p className="text-gray-400 text-[15px] font-medium">아직 판매 중인 물건이 없네요!</p>
            <Link href="/write" className="inline-block px-6 py-2.5 bg-[#ff6b6b] text-white font-bold rounded-xl shadow-lg shadow-[#ff6b6b]/20">물건 등록하기</Link>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden relative border border-black/5 shadow-sm shrink-0">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[15px] font-bold text-gray-900 truncate">{item.title}</p>
                  <p className="text-[13px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                    {item.category} • {getTimeAgo(item.created_at)}
                  </p>
                  <p className="text-[15px] font-black text-[#ff6b6b] mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-200">
                   <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            ))}
            {items.length > 5 && (
              <button className="w-full py-4 text-center text-[14px] font-bold text-gray-500 hover:bg-gray-50">
                나의 전체 목록 보기 (+{items.length - 5})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


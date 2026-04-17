import Link from "next/link";
import { createClient } from "../../lib/supabaseServer";
import AuthButton from "../../components/AuthButton";
import MyItemsList from "../../components/MyItemsList";
import StripeConnectButton from "../../components/StripeConnectButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 대시보드 데이터 패칭
  let sellingCount = 0;
  let wishlistCount = 0;
  let chatCount = 0;
  let items: any[] = [];
  let userBrix = 36.5; // 기본값
  let profileData: any = null;

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

    // 4. 피치 당도 및 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profileData = profile;
    
    if (profile) {
      userBrix = profile.peach_brix;
      // 프로필 정보를 metadata 대신 테이블 정보로 덮어쓰기
      user.user_metadata = {
        ...user.user_metadata,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        city: profile.city
      };
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-5 py-4">
        <h1 className="text-[20px] font-bold text-gray-900">마이 피치</h1>
        <div className="flex items-center gap-3">
          <Link href="/profile/edit" className="text-gray-400 p-2 hover:bg-gray-50 rounded-full transition-all">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* Profile & Sweetness Section */}
      <div className="px-5 pt-8 pb-8">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-peach to-peach-dark rounded-full blur opacity-25"></div>
            <div className="relative w-20 h-20 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md overflow-hidden shrink-0">
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.user_metadata.avatar_url || user.user_metadata.picture} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-3xl">🍑</span>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-gray-900 leading-tight">
              {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "사용자"}
            </h2>
            <p className="text-[13px] text-gray-400 font-medium">{user?.user_metadata?.city || "애틀란타"} • 피치마켓 1기</p>
            <div className="mt-2.5">
               <AuthButton user={user} />
            </div>
          </div>
        </div>

        {/* Peach Brix (Sweetness) - Premium Meter */}
        {user && (
          <div className="mt-8 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-gray-400">나의 명품 지수</span>
                <span className="text-[18px] font-black text-gray-900 flex items-center gap-1.5">
                  피치 당도 {userBrix}% 🍑
                </span>
              </div>
              <span className="text-[12px] font-bold text-peach-dark bg-peach-light/30 px-2 py-0.5 rounded-full mb-1">상위 5%</span>
            </div>
            
            {/* Gauge Bar */}
            <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-300 via-peach to-peach-dark rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(userBrix / 100) * 100}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer"></div>
              </div>
            </div>
            
            <div className="flex justify-between mt-2.5 text-[11px] font-bold text-gray-300">
              <span>0%</span>
              <span>기본 당도 36.5%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Stats Mini Dashboard */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "판매", value: sellingCount, color: "text-gray-900" },
            { label: "찜", value: wishlistCount, color: "text-peach-dark" },
            { label: "채팅", value: chatCount, color: "text-blue-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer">
              <span className={`text-[22px] font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Menu List */}
      <div className="px-4 space-y-3">
        {/* Stripe Connect Section */}
        {user && (
          <StripeConnectButton 
            stripeAccountId={profileData?.stripe_account_id} 
            isOnboardingComplete={profileData?.stripe_onboarding_complete} 
          />
        )}
        
        <div className="space-y-1">
          {[
            { icon: "🧡", label: "찜한 목록", href: "/wishlist", count: wishlistCount },

          { icon: "💬", label: "채팅 목록", href: "/chat", count: chatCount },
          { icon: "🛍️", label: "나눔/무료 상품", href: "/?category=나눔/덤" },
        ].map((menu) => (
          <Link
            key={menu.label}
            href={menu.href}
            className="flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <span className="text-xl w-6 text-center">{menu.icon}</span>
              <span className="text-[16px] font-bold text-gray-800">{menu.label}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              {(menu.count ?? 0) > 0 && (
                <span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {menu.count}
                </span>
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>

      {/* My Listings Dashboard */}
      <div id="items" className="mt-8 border-t-8 border-gray-50 pt-8 pb-10">
        <div className="px-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-gray-900">나의 판매 내역</h3>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Manage</span>
          </div>
          <Link href="/write" className="text-[13px] font-bold text-[#ff6b6b] hover:underline underline-offset-4">새 물건 등록 ➔</Link>
        </div>

        {!user ? (
          <div className="px-5 py-16 text-center text-gray-400 bg-gray-50/50 mx-5 rounded-[24px]">
             로그인하면 대표님의 아이템들을<br/>여시에서 관리할 수 있습니다! 🍑
          </div>
        ) : (
          <MyItemsList initialItems={items} />
        )}
      </div>
    </div>
  );
}


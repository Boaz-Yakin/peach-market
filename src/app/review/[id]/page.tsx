import { createClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ReviewForm from "./ReviewForm";

export default async function ReviewPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ roomId?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const id = params.id;
  const roomId = searchParams.roomId;
  const supabase = await createClient();

  // 1. 상품 정보 가져오기
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    console.error("Item fetch error:", itemError);
    notFound();
  }

  // 2. 현재 로그인 유저 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-xl font-bold mb-4">로그인이 필요합니다</h1>
        <p className="text-gray-500 mb-8">평가를 남기려면 먼저 로그인해 주세요.</p>
        <a href="/auth/login" className="w-full py-4 bg-primary text-white rounded-2xl font-bold">로그인하러 가기</a>
      </div>
    );
  }

  // 3. 타겟 결정 (판매자 vs 구매자)
  let targetId = item.user_id; // 기본값은 판매자
  
  // 만약 현재 로그인한 사람이 판매자라면, 평가 대상은 '구매자'여야 함
  const isSeller = user.id === item.user_id;

  if (isSeller) {
    // 1순위: URL 쿼리 파라미터의 roomId로 구매자 찾기
    if (roomId) {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("buyer_id")
        .eq("id", roomId)
        .single();
      if (room) targetId = room.buyer_id;
    } 
    // 2순위: roomId가 없을 경우, 이 상품과 관련된 채팅방 중 가장 최근의 구매자 찾기
    else {
      const { data: latestRoom } = await supabase
        .from("chat_rooms")
        .select("buyer_id")
        .eq("item_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (latestRoom) targetId = latestRoom.buyer_id;
    }
  } else {
    // 내가 판매자가 아니라면(구매자라면), 평가 대상은 당연히 판매자(item.user_id)
    targetId = item.user_id;
  }

  // 자기 자신을 평가하지 않도록 최종 방어
  if (targetId === user.id) {
    // 만약 여기까지 왔음에도 타겟이 나 자신이라면 에러 페이지나 토스트 유도 필요
    // 여기서는 안전을 위해 시스템 관리자로 임시 지정하거나 안내
  }

  // 4. 대상 프로필 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .single();

  const targetName = profile?.display_name || "피치마켓 사용자";

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-low">
      <ReviewForm 
        itemId={item.id}
        itemTitle={item.title}
        targetId={targetId}
        targetName={targetName}
        userId={user.id}
        roomId={roomId}
      />
    </div>
  );
}

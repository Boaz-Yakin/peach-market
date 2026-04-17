import { createClient } from "./supabaseBrowser";

/**
 * AI 답변 캐싱 유틸리티
 * 비즈니스 로직: 질문 발생 시 DB 캐시 확인 -> 있으면 반환 -> 없으면 AI 호출 및 캐싱
 */
export async function getAIAnswerWithCache(query: string, aiCategory: string = "GENERAL"): Promise<string> {
  const supabase = createClient();
  const normalizedQuery = query.trim().toLowerCase();

  // 1. 캐시 확인
  const { data: cachedData, error: fetchError } = await supabase
    .from("query_cache")
    .select("answer, hit_count")
    .eq("query", normalizedQuery)
    .single();

  if (cachedData && !fetchError) {
    // 캐시 히트! 카운트 업데이트 (Background)
    supabase
      .from("query_cache")
      .update({ hit_count: cachedData.hit_count + 1, updated_at: new Date().toISOString() })
      .eq("query", normalizedQuery)
      .then();
    
    console.log(`[AI Cache Hit] Query: ${normalizedQuery}`);
    return cachedData.answer;
  }

  // 2. 캐시 미스 -> AI 호출 (여기서는 Mock 또는 Placeholder AI 호출)
  console.log(`[AI Cache Miss] Calling AI for: ${normalizedQuery}`);
  
  // TODO: 실제 OpenAI 또는 Gemini API 연동 시 이 부분을 교체합니다.
  const aiAnswer = await mockAIInference(normalizedQuery);

  // 3. 답변 캐싱 처리
  if (aiAnswer) {
    const { error: insertError } = await supabase
      .from("query_cache")
      .insert({
        query: normalizedQuery,
        answer: aiAnswer,
        hit_count: 1
      });
    
    if (insertError) {
      console.error("Failed to cache AI answer:", insertError);
    }
  }

  return aiAnswer;
}

/**
 * 실제 AI API 연동 전까지 사용할 Mock 함수
 */
async function mockAIInference(query: string): Promise<string> {
  // 지연 시간 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (query.includes("매너 온도") || query.includes("피치 브릭스")) {
    return "피치 브릭스(Peach Brix)는 사용자의 거래 매너를 복숭아의 당도처럼 나타내는 시스템입니다. 36.5도(기본)에서 시작하여 칭찬을 받으면 올라가고 비매너 신고를 받으면 내려갑니다.";
  }
  
  if (query.includes("거래 방법") || query.includes("안심 결제")) {
    return "피치마켓은 기본적으로 직거래를 권장합니다. 하지만 사기 방지를 위해 도입된 'Peach Safe-Pay(안심 결제)'를 이용하시면 물건을 받으신 후 결제 대금이 판매자에게 정산되어 안전합니다.";
  }

  return `질문하신 '${query}'에 대한 답변을 준비 중입니다. 아틀란타의 따뜻한 중고거래 커뮤니티, 피치마켓이 더 똑똑해지고 있습니다!`;
}

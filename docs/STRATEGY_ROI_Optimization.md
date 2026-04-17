# 🍑 Peach Market: ROI Optimization & Revenue Strategy

> **Strategist:** Zegal (Chief Strategist)
> **Status:** Draft / Strategic Blueprint
> **Last Updated:** 2026-04-16
> **Goal:** Maximize business ROI by minimizing operational costs and establishing hyper-local revenue streams.

---

## 1. AI 가변비 절감 (AI Cost Optimization)
AI 호출 비용은 스케일업 시 가장 큰 부담입니다. 이를 '지식 자산화'를 통해 해결합니다.

### 🛠️ 전략: Semantic FAQ Caching
- **로직:** 사용자 질문 ➡️ `query_cache` 테이블 조회 ➡️ 유사 답변 존재 시 즉시 반환 ➡️ 없을 때만 AI 호출 및 결과 저장.
- **기술 스택:** Supabase (PGVector 추천) / Keyword matching.
- **기대 효과:** AI API 지출의 약 40%~60% 절감 가능.

## 2. 하이퍼 로컬 수익화 (Hyper-Local Revenue)
범용 광고(AdSense 등)가 아닌 지역 밀착형 직접 광고를 통한 고단가 수익 창출.

### 🛠️ 전략: Atlanta Direct Ad-Slot
- **슬롯 위치 (Ad Slots):**
    - **A (Native Feed):** 메인 상품 리스트 5~10번째 간격 삽입.
    - **B (Community Banner):** '피치 광장' 카테고리별 상단 고정 배너.
    - **C (Contextual Suggestion):** 채팅 내 만남 장소 키워드 감지 시 인근 업체 추천.
- **수익 모델:** CPM $5.0 이상의 지역 비즈니스 직접 유치.

## 3. 인프라 다이어트 (Infrastructure Diet)
고정비 zero를 목표로 인프라를 효율적으로 설계합니다.

### 🛠️ 전략: Free-Tier Maximum Survival
- **데이터 효율:** Realtime 소켓 사용 최소화 (채팅 전용), DB Index 최적화로 Read 오버헤드 방지.
- **연산 분산:** 복잡한 UI 연산은 Client-side(React)에서 처리, Edge Functions 사용 절제.
- **미디어 최적화:** `browser-image-compression` 적용으로 Storage 용량 및 대역폭 절감.

## 4. 거래 수익 구조 (Transaction Fee)
플랫폼의 지속 가능성을 위한 수수료 모델 도입.

### 🛠️ 전략: Peach Safe-Pay (Escrow)
- **수수료 정책:** 안심 결제 이용 시 거래액의 **3.0% ~ 3.5%** 플랫폼 수수료 부과.
- **프로세스:** 결제 ➡️ 대금 보관 (Escrow) ➡️ 구매 확정 ➡️ 정산.
- **가치 제안:** "사기 걱정 없는 따뜻한 거래"를 명분으로 수익화 정당성 확보.

---

## 📅 실행 로드맵 (Execution Roadmap)

### Phase A: 수익화 인프라 구축 (Short-term)
1. [x] **UI 광고 슬롯 컴포넌트 (`AdSlot.tsx`) 개발:** 홈 및 커뮤니티 피드 삽입 완료. (2026-04-16)
2. [x] **AI 캐싱 시스템 구축:** `query_cache` 로직 및 `aiCache.ts` 개발 완료. (2026-04-16)
3. [x] **이미지 압축 유틸 연동:** 업로드 전 클라이언트 사이드 압축 강제화 및 WebP 전환 완료.

### Phase B: 안심 결제 및 광고 관리 (Mid-term)
1. [ ] **안심 결제 Flow 설계:** `transactions` 테이블 고도화 및 수수료 계산 로직 완료. (개발 중)
2. [ ] **지역 광고주 CMS:** 로컬 비즈니스가 직접 이미지를 올릴 수 있는 심플한 대시보드.

---

> **전략가의 한마디:** "비즈니스의 승리는 기술력보다 지속 가능한 현금 흐름에서 나옵니다. 위 로직들은 기술적으로는 단순하나, 사업적으로는 피치마켓을 '취미'에서 '기업'으로 바꾸는 변곡점이 될 것입니다."

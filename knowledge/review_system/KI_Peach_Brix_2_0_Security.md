---
title: "Peach Brix 2.0: 서버 사이드 신뢰도 시스템 구현 패턴"
category: "Security & Architecture"
tags: [supabase, rpc, postgrest, brix, transaction]
project: "peach-market"
created_at: 2026-04-14
---

# 🍑 Peach Brix 2.0: 신뢰도 시스템 보안 아키텍처

> **배경:** 유저 간 거래 후 남기는 리뷰 점수가 클라이언트 측 로직에 의해 조작되는 것을 방지하고, 데이터의 원자성(Atomicity)을 보장하기 위해 도입된 서버 사이드 트랜잭션 패턴입니다.

## 1. 핵심 아키텍처: Supabase RPC (Stored Procedure)
클라이언트에서 여러 번의 API 호출(`update`, `insert`)을 수행하는 대신, DB 내부에서 모든 로직을 처리하는 SQL 함수를 호출합니다.

### 🛡️ 보안 효과
- **점수 조작 방지:** 보너스 점수(`brix_bonus`) 계산 로직이 DB 서버 내부에 숨겨져 있어 유저가 프론트엔드에서 점수를 위조할 수 없습니다.
- **원자성 보장:** 리뷰 저장과 프로필 점수 업데이트가 하나의 트랜잭션으로 묶여, 네트워크 오류 시에도 데이터가 꼬이지 않습니다.
- **비즈니스 룰 자동화:** `COALESCE(peach_brix, 36.5)`와 `LEAST(100, ...)`를 통해 시스템 기본값과 최대치를 강제합니다.

## 2. 구현 데이터 구조

### SQL 함수: `submit_review`
```sql
CREATE OR REPLACE FUNCTION submit_review(
  p_item_id UUID,
  p_reviewer_id UUID,
  p_target_id UUID,
  p_badges TEXT[]
) RETURNS JSONB AS $$
-- 로직 생략: 점수 계산 (+0.2 per badge), 중복 체크, 프로필 업데이트
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. 프론트엔드 사용법 (Cody's Snippet)
```typescript
const { data, error } = await supabase.rpc('submit_review', {
  p_item_id: itemId,
  p_reviewer_id: userId,
  p_target_id: targetId,
  p_badges: selectedBadges
});
```

## 4. Arch의 검증 코멘트
- **Integrity:** 반드시 `reviews` 테이블의 `UNIQUE(item_id, reviewer_id)` 제약 조건과 함께 사용하여 중복 평가를 물리적으로 차단해야 함.
- **Privacy:** 평가 데이터는 RLS를 통해 보호되어야 하며, 타겟 유저에게는 결과값만 `notifications`를 통해 전달하는 것이 권장됨.

---
title: "Peach Safe-Pay: Internal Wallet & Escrow System Architecture"
category: "Strategy & Finance"
tags: [escrow, point-system, virtual-wallet, fintech, strategy]
created_at: 2026-04-17
author: "Zegal (Chief Strategist)"
---

# 🍑 Peach Safe-Pay 전략 및 시스템 명세 (v1.0)

## 1. 개요 (Overview)
'피치 세이프 페이'는 애틀란타 한인 커뮤니티 내의 안전한 비대면/대면 거래를 보장하기 위한 **가상 월렛 기반의 에스크로 시스템**입니다. 외부 결제 수수료를 최적화하고 사용자 체류 시간(Retention)을 극대화하는 것을 전략적 목표로 합니다.

## 2. 핵심 비즈니스 모델: 가상 포인트 시스템
플랫폼 내부에서 통용되는 '포인트(머니)'를 도입하여 결제 마찰을 최소화합니다.

- **충전 (Recharge)**: 외부 PG(Stripe 등)를 통해 현금을 포인트로 전환.
- **결제 (Lock)**: 거래 시 포인트가 판매자에게 바로 가지 않고 **플랫폼 잠금** 상태로 유지.
- **확정 (Release)**: 구매자가 만족 시 포인트를 판매자 지갑으로 해제.
- **출금 (Payout)**: 판매자가 포인트를 다시 현금으로 환전 요청.

## 3. 거래 단계별 상세 프로세스 (Escrow Flow)

### Step 1: 결제 요청 (Payment Intent)
- **트리거**: 채팅방 내 '안심결제' 버튼 클릭.
- **상태**: `transactions` 테이블에 `pending` 레코드 생성.
- **UI**: 채팅창에 결제 전용 폼(금액, 수수료 표시) 노출.

### Step 2: 결제 완료 및 보관 (Escrow Holding)
- **동작**: 유저의 가상 월렛 잔액 차감 -> `escrow_pool` 계좌로 이동.
- **상태**: `status` -> `paid`.
- **배경**: 판매자에게 알림 발송 ("입금이 확인되었습니다. 물건을 전달해주세요.")

### Step 3: 상품 확인 및 구매 확정 (Confirmation)
- **동작**: 구매자가 '구매 확정' 클릭.
- **상태**: `status` -> `completed`.
- **결과**: `escrow_pool`에서 판매자 지갑(`wallets.balance`)으로 포인트 이동.

### Step 4: 정산 (Settlement)
- **플랫폼 수익**: 전체 금액의 3.5%를 플랫폼 수수료로 공제.
- **정산 완료**: 판매자는 출금 버튼을 통해 자신의 은행 계좌로 지급 요청 가능.

## 4. 데이터베이스 설계 (Database Spec)

### `wallets` 테이블
- `user_id` (uuid, primary key)
- `balance` (numeric): 가용 포인트
- `locked_balance` (numeric): 현재 에스크로에 묶인 포인트
- `updated_at` (timestamp)

### `transactions` 테이블 (상태 관리용)
- `id` (uuid)
- `item_id` (uuid)
- `buyer_id` / `seller_id` (uuid)
- `amount` (numeric)
- `fee` (numeric)
- `status` (enum: pending, paid, completed, cancelled, disputed)

### `point_ledger` 테이블 (원장)
- 모든 포인트 증감(충전, 소모, 환불)을 기록하는 불변(Immutable) 로그 테이블.

## 5. 전략적 방어 기제 (Security & Governance)
1. **자동 확정 시스템**: 상품 전달 확인 메시지 이후 48시간 동안 응답이 없으면 판매자 보호를 위해 자동 확정 처리.
2. **분쟁 중재 (Dispute)**: 신고 시 자금 흐름 동결 및 관리자 개입.
3. **피치 브릭스 연계**: 안심결제 횟수에 따라 '피치 당도' 상승 가산점 부여.

---

> **"전략은 단순하되 시스템은 철저해야 합니다. 피치 마켓의 안심결제는 이웃 간의 따뜻한 신뢰를 숫자로 증명하는 장치가 될 것입니다."**
> — 제갈 (Zegal), Cyber-Nexus 전략 본부장

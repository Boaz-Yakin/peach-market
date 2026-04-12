# 🍑 Peach Market Project Specifications (Blueprints)

> **Document Status:** Active
> **Last Updated:** 2026-04-12
> **Goal:** To establish a clear "Definition of Done", target features, and workflows for the Peach Market MVP and beyond, adhering to the Agentic 3-Layer Architecture.

## 1. Project Overview & Goals
- **Project Name:** Peach Market (피치마켓)
- **Target Audience:** 애틀란타 한인 커뮤니티 (Atlanta Korean Community)
- **Core Value:** 신뢰(Peach Brix) 기반의 안전하고 따뜻한 중고거래 및 지역 커뮤니티 플랫폼.
- **Current Phase:** MVP Finalization & "Peach Square(Community)" Initialization.

## 2. Tech Stack & Infrastructure
- **Frontend / Framework:** Next.js 14+ (App Router, Turbopack)
- **Styling:** Tailwind CSS (v4)
- **Backend / Database:** Supabase (PostgreSQL, Realtime, Storage)
- **Authentication:** Supabase Auth (Google Social Login preferred)
- **Hosting / Deployment:** Vercel (Auto-deployment via GitHub CI/CD)

## 3. Core Workflows (SOPs)
개발/운영 시 다음의 표준 운영 절차를 준수합니다.
1. **Feature Development:**
   - 새로운 기능은 `branch`를 나누지 않더라도, MVP 단위로 아주 작게 쪼개어 개발한다.
   - UI 구성 -> Supabase DB 연동 -> 에러 핸들링 추가 순서로 진행.
2. **Database Changes:**
   - 테이블이나 RLS 정책을 추가할 경우 반드시 Supabase SQL Editor를 통해 실행할 쿼리를 명시적으로 대표님께 묻고 실행을 확인받는다.
3. **Knowledge Initialization:**
   - 중요한 보안, 인증, 중복 방지, 실시간 소켓 등 핵심 구조는 해결 즉시 `knowledge/` 폴더에 `metadata.json`과 `.md` 형식으로 자산화한다.

## 4. Feature Checklist & "Definition of Done"

### 🟢 Phase 1: MVP Trading Core (Completed)
- [x] Google Social Login 연동 및 Profiles 테이블 동기화
- [x] 상품 등록 (이미지 Storage 업로드), 수정, 삭제, 리스트 조회
- [x] 키워드, 카테고리 필터링이 포함된 지능형 검색
- [x] 1:1 실시간 채팅 (Supabase Realtime) 및 안읽음 뱃지 처리
- [x] 구매/예약/완료 상태 변경 및 관심 상품(찜하기)
- [x] 나의 활동 대시보드 (판매글, 찜, 채팅 요약)

### 🟡 Phase 2: Trust System (In Progress -> Completed)
- [x] 매너 온도 (Peach Brix) 계산식 적용
- [x] 거래 완료 시 양방향 평가 및 `reviews` 테이블을 통한 중복 평가 방지 

### 🔴 Phase 3: Community & Expansion (Current Focus)
- [ ] **피치 광장 (동네생활 게시판):**
  - "준비 중" 상태 해제 및 `posts`, `comments` 테이블 설계.
  - 카테고리별(맛집, 분실물, 취미 등) 글쓰기, 사진 첨부, 댓글 기능.
- [ ] **웹 푸시 & 고도화 알림:**
  - 채팅 메시지 도착, 내 글에 달린 댓글, 관심 키워드 상품 등록 시 알림.
- [ ] **클린 피치 마스터 (신고/차단 기능):**
  - 비매너 유저 차단 및 게시글 신고 기능.
- [ ] **안전 거래 장소 지도 공유:**
  - 채팅방 내 구글 지도 혹은 정적 지도를 통한 거래 장소 핀 공유.

## 5. Security & Knowledge Management
- 클라이언트 노출이 불가한 키워드(`SERVICE_ROLE_KEY` 등)는 절대 `.env.local` 외에는 저장하지 않음.
- RLS 정책은 항상 최소 권한 원칙(Principle of Least Privilege)을 따른다.

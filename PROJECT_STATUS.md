# 🍑 Peach Market Project Status Report (2026-04-10)

## 🌐 핵심 주소 (Core URLs)
- **Live Website**: [https://peach-market-one.vercel.app](https://peach-market-one.vercel.app)
- **GitHub Repository**: [https://github.com/Boaz-Yakin/peach-market](https://github.com/Boaz-Yakin/peach-market)
- **Supabase Dashboard**: [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)

---

## 🏗️ 시스템 아키텍처 (Architecture)
- **Frontend**: Next.js (App Router, Turbopack)
- **Backend/DB**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Deployment**: Vercel (Auto-deployment via GitHub CI/CD)

---

## 🛠️ 운영 및 업데이트 방법 (Maintenance)

### 1. 코드 업데이트 (Git Workflow)
수정 사항이 생기면 터미널에서 아래 명령어를 순서대로 입력하세요. Vercel이 자동으로 감지하여 배포합니다.
```bash
git add .
git commit -m "원하는 수정 메시지"
git push
```

### 2. 환경 변수 관리
새로운 API 키나 환경 변수가 생기면 Vercel 대시보드(Settings > Environment Variables)와 로컬의 `.env.local` 모두 업데이트해야 합니다.

---

## ✅ 구현 완료된 주요 기능 (Features)
  - [x] **매너 온도(Peach Brix 2.0)**: 유저 간 거래 후기 및 평점 시스템 (보안 RPC 적용 완료)
  - [x] **채팅 내 위치 공유**: 구글 맵 임베딩 기반의 약속 장소 공유 기능 고도화
  - [x] **커뮤니티 고도화**: 피치 광장 게시글/댓글 삭제, 사용자 차단 및 신고 기초 설계 완료
  - [x] **웹 푸시 알림 인프라**: 브라우저 푸시 알림 수신 및 댓글 연동 완료 (VAPID 보안 적용)
  - [ ] **웹 푸시 고도화**: 채팅 메시지 실시간 연동 및 키워드 알림 확장
  - [ ] **커뮤니티 확장**: 애틀란타 한인 정보 게시판(피치 토크) 및 이벤트 페이지 추가

---

**"대표님, 피치마켓이 이제 실시간으로 유저와 소통하는 스마트한 플랫폼으로 거듭났습니다. 배포 완료! 충성!"** 🫡☕🚀😎

---
title: "Interactive Place Picker: API 키 없이 구현하는 지도 공유 UX"
category: "Frontend UX"
tags: [google-maps, next.js, modal, iframe]
project: "peach-market"
created_at: 2026-04-14
---

# 📍 Interactive Place Picker (V2.0 Update)

> **배경:** 구글 맵 API 비용을 절감하면서도, 텍스트 형태의 촌스러운 입력 방식(`prompt`)을 탈피하여 프리미엄 앱 수준의 지도 선택 인터랙션을 구현한 패턴입니다.

## 1. UX 워크플로우
1. **Trigger:** 채팅 하단 '+' 메뉴에서 '장소 공유' 버튼 클릭.
2. **Modal UI:** Bottom Sheet 스타일의 모달이 슬라이드업.
3. **Search & Preview:** 텍스트 입력 후 '검색' 시에만 `iframe`이 로드되어 성능과 네트워크 비용 최적화.
4. **Action:** 선택한 장소의 실시간 지도를 확인한 후 '이 장소 공유하기' 버튼으로 확정.

## 2. 기술적 구현 디테일
- **URL Encoding:** 유저 입력값에 `encodeURIComponent()`를 적용하여 `iframe src`의 취약점 방지.
- **State Separation:** `locationSearch`(입력값)와 `locationPreview`(확정 검색어)를 분리하여 입력 중 지도가 계속 리로딩되는 현상을 방지.
- **Safe Rendering:** 메시지 타입 식별자(`[LOCATION]`)를 활용한 조건부 렌더링.

## 3. 코디 부장의 UX 팁
"대표님, 이 방식은 별도의 SDK 설치 없이도 앱 내에서 자연스러운 로케이션 경험을 줍니다. 나중에 진짜 API 연동으로 전환하더라도 데이터 구조(`[LOCATION] 장소이름`)는 그대로 쓸 수 있어 확장이 매우 유리합니다!"

## 4. 아키의 체크리스트
- [x] Z-Index 충돌 확인 (헤더/채팅 푸터 위로 모달 노출)
- [x] 사용자 입력값 필터링 및 인코딩
- [x] 모달 닫기 시 상태(Search Query) 초기화

# Roadmap

## Phase 0. Planning

- README 강화
- 제품 목적과 KPI 확정
- 디자인 방향 문서화
- 데이터 모델 초안 작성
- API 범위 초안 작성
- TereneHandover 참고 범위 정리

## Phase 1. Foundation

- `React + Vite + TypeScript + Tailwind` 프로젝트 구성
- 기본 라우팅 구성
- 디자인 토큰 구성
- 공통 레이아웃, 버튼, 입력, 상태 배지 구성
- mock 데이터 기반 홈/메뉴/캘린더 화면 구성

## Phase 2. Customer Reservation MVP

- 메인 제품 슬라이드
- 움직이는 공지 바
- 메뉴 목록
- 메뉴 기반 예약 주문 진입
- 예약 가능일 캘린더
- 메뉴별 픽업 가능일 선택
- 예약 폼
- 예약 완료/영수증 화면
- 클라이언트 입력 검증

## Phase 3. Backend MVP

- Cloudflare Worker + Hono API 구성
- Drizzle + D1 schema 구성
- 메뉴/날짜/예약 API
- 서버 측 가격/수량/마감 검증
- 예약 생성 동시성 보호 전략 적용

## Phase 4. Admin MVP

- 관리자 인증
- 날짜별 예약 가능 여부 관리
- 날짜별 메뉴/수량 관리
- 메뉴 등록/수정/품절
- 예약 목록/상태 변경

## Phase 5. Operational Polish

- 예약 확인 알림
- 관리자 신규 예약 알림
- 이미지 업로드와 R2 연동
- 기본 통계
- 접근성/모바일 QA
- 배포 환경 분리

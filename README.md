# Bakery Dain

다닷네 베이커리를 위한 프리오더 예약 웹사이트입니다.

목표는 단순한 소개 페이지가 아니라, 작은 홈베이커리가 실제로 예약을 받고, 날짜별 생산량을 관리하고, 주문 내역을 확인하며, 반복 판매로 이어질 수 있는 운영형 사이트를 만드는 것입니다.

## Product Statement

**소소하게 굽지만, 예약과 주문은 깔끔하게 받는 귀여운 프리오더 베이커리 사이트.**

Sprout Artisan Bakery의 구조적 장점인 넓은 여백, 큰 제품 사진, 흐르는 공지 바, 단정한 메뉴/프리오더 UI를 참고하되, 다닷네 베이커리 인스타그램에서 보이는 친근하고 귀여운 홈베이커리 감성을 중심에 둡니다.

## Brand Keywords

```txt
small bakery
handmade
pre-order
pickup only
limited quantity
giftable
seasonal
warm cream
cute but clean
```

## Core User Value

- 고객은 이번 주 예약 가능일과 메뉴를 빠르게 이해하고 예약할 수 있어야 합니다.
- 관리자는 복잡한 쇼핑몰 관리자 없이도 날짜, 메뉴, 주문 상태를 관리할 수 있어야 합니다.
- 사이트는 인스타그램 DM 중심 운영보다 더 안정적인 예약 흐름을 제공해야 합니다.
- 수량 제한, 마감, 픽업일, 요청사항이 누락되지 않아 실제 제조와 픽업에 도움이 되어야 합니다.

## Primary Scope

### Customer

- 메인 제품 이미지 슬라이드
- 움직이는 예약 안내 바
- 이번 주 메뉴 카드
- 예약 가능일 캘린더
- 메뉴 중심 예약 주문 흐름
- 메뉴/수량 선택
- 이름, 연락처, 요청사항 입력
- 예약 완료 영수증/확인 화면
- 인스타그램 연결

### Admin

- 관리자 로그인
- 예약 가능일 관리
- 날짜별 주문 마감 설정
- 날짜별 픽업 시간 설정
- 날짜별 주문 가능 메뉴 설정
- 메뉴 등록/수정/품절 처리
- 예약 목록 확인
- 예약 상태 변경
- 간단한 매출/예약 지표 확인

## Tech Stack

- `React`
- `Vite`
- `TypeScript`
- `Tailwind CSS`
- `Motion`
- `React Router`
- `Hono`
- `Cloudflare Pages`
- `Cloudflare Workers`
- `Cloudflare D1`
- `Cloudflare R2`
- `Drizzle ORM`
- `Zod`
- `lucide-react`

## Architecture Direction

```txt
Customer/Admin Browser
  -> React + Vite frontend on Cloudflare Pages
  -> Hono API on Cloudflare Workers
  -> Cloudflare D1 for relational data
  -> Cloudflare R2 for menu/product images
  -> Optional notification provider for admin/customer messages
```

프론트엔드는 화면 조립과 사용자 입력에 집중하고, 예약 생성, 가격 확정, 수량 차감, 관리자 권한, 주문 상태 변경은 Worker API에서만 처리합니다.

현재 프론트엔드의 기본 API 주소는 `.env.development`와 `.env.production`에 아래처럼 고정되어 있습니다.

```txt
VITE_API_BASE_URL=https://bakery-dain-api.overjoy1008.workers.dev/api
```

따라서 로컬 Vite 화면에서도 회원가입, 로그인, 메뉴 조회, 픽업 규칙 조회, 예약 생성은 원격 Worker를 통해 처리합니다. D1 직접 접근 토큰은 브라우저에 넣지 않습니다.

## Reference Source

`../TereneHandover`에는 숙박 예약 서비스에서 사용하던 캘린더, 영수증, 관리자 테이블, 인증, API, DB, 알림 구조가 들어 있습니다. Bakery Dain에서는 해당 구조를 다음처럼 축소/변환해서 참고합니다.

- 숙박 예약의 날짜/객실 재고 -> 베이커리의 픽업 날짜/메뉴별 수량
- 객실/패키지/추가 서비스 -> 메뉴/선물 포장/시즌 옵션
- 예약 영수증 -> 프리오더 확인서
- 관리자 날짜 설정 -> 픽업 가능일/마감일/쉬는 날 설정
- 알림톡/이메일 후속 처리 -> 예약 접수/상태 변경 알림

자세한 참고 지도는 [docs/references/terene-handover-map.md](docs/references/terene-handover-map.md)를 봅니다.

## Documentation Map

- [Product Plan](docs/product/product-plan.md)
- [KPI Plan](docs/product/kpi-plan.md)
- [Roadmap](docs/product/roadmap.md)
- [Brand and Design Direction](docs/design/brand-and-design.md)
- [UX Flows](docs/design/ux-flows.md)
- [System Architecture](docs/architecture/system-architecture.md)
- [Frontend Architecture](docs/architecture/frontend-architecture.md)
- [Backend Architecture](docs/architecture/backend-architecture.md)
- [API Contract Plan](docs/api/api-contract-plan.md)
- [Database Plan](docs/database/database-plan.md)
- [Admin Plan](docs/admin/admin-plan.md)
- [Development Ground Rules](docs/operations/development-ground-rules.md)
- [Delivery Plan](docs/operations/delivery-plan.md)
- [Risk Register](docs/operations/risk-register.md)

## Project Structure

```txt
bakery-dain/
  docs/
    product/
    design/
    architecture/
    api/
    database/
    admin/
    operations/
    references/
  public/
    images/
    icons/
  src/
    main.tsx
    app/
    pages/
    components/
    sections/
    features/
      reservation/
      menu/
      admin/
      receipt/
      auth/
    hooks/
    lib/
    data/
    styles/
  worker/
    index.ts
    routes/
    db/
    middleware/
    services/
    utils/
```

## Development Principles

### 1. Framework

- 기본은 `React + Vite`.
- 라우팅은 `React Router`.
- 서버 로직은 `Cloudflare Workers + Hono`.
- 특별한 이유 없이 `Next.js`, SSR, API Routes, Server Actions 구조로 바꾸지 않습니다.

### 2. Product First

- 모든 기능은 작은 베이커리 운영자의 시간 절약과 예약 오류 감소에 기여해야 합니다.
- 운영자가 매일 쓰기 어려운 복잡한 설정은 MVP에서 제외합니다.
- 고객 화면은 예뻐야 하지만, 픽업일/마감/가격/수량은 더 명확해야 합니다.

### 3. Reservation Integrity

- 가격, 예약 가능 여부, 수량 차감은 서버가 확정합니다.
- 클라이언트에서 계산한 합계나 가능 상태만 믿지 않습니다.
- 예약 생성은 중복 제출, 동시 주문, 마감 시각 경합을 고려합니다.
- 날짜별 메뉴와 메뉴별 수량은 독립적으로 관리합니다.

### 4. Styling

- 스타일링은 `Tailwind CSS` 중심.
- 레이아웃은 `flex`, `grid`, `gap` 중심.
- 불필요한 absolute 정렬과 누적 margin 조정을 피합니다.
- UI 카드는 상품, 반복 목록, 관리자 패널처럼 실제로 묶음이 필요한 곳에만 씁니다.

### 5. Visual Direction

- 배경은 따뜻한 크림/아이보리 톤.
- 텍스트는 진한 코코아 브라운.
- 포인트는 버터 옐로우, 쿠키 브라운, 딸기잼 레드.
- Sprout처럼 큰 사진과 여백을 쓰되, 다닷네의 귀여운 홈베이커리 톤을 유지합니다.

```css
:root {
  --cream: #fff8ed;
  --butter: #f6d58a;
  --cookie: #c8894b;
  --toast: #8b5a35;
  --jam: #d96b6b;
  --cocoa: #3b2a22;
  --soft-gray: #f2eee8;
}
```

### 6. Typography

- 기본 후보는 `Poor Story` 또는 `Noto Sans KR`.
- 제목과 브랜드 포인트는 귀여운 톤을 허용합니다.
- 가격, 날짜, 예약 상태, 약관, 관리자 표는 가독성을 우선합니다.

### 7. Animation

- 제품 슬라이드, 흐르는 공지 바, hover feedback 정도로 제한합니다.
- 예약/결제/관리자 작업을 방해하는 과한 애니메이션은 피합니다.
- 필요한 경우 `prefers-reduced-motion`을 고려합니다.

### 8. Admin Simplicity

- 관리자는 개발자나 쇼핑몰 운영자가 아니라 작은 베이커리 운영자입니다.
- 날짜별 가능/마감/휴무, 메뉴별 판매 가능 여부, 예약 상태 변경이 한 화면에서 이해되어야 합니다.
- 통계는 초기에는 총 예약수, 예상 매출, 마감 임박, 인기 메뉴 정도만 둡니다.

### 9. API & Data

- API 입력은 `Zod`로 검증합니다.
- DB 스키마는 `Drizzle ORM`으로 관리합니다.
- 이미지는 DB에 저장하지 않고 `Cloudflare R2` key 또는 URL만 저장합니다.
- 개인정보는 필요한 최소한만 저장합니다.

### 10. Delivery

- 문서 -> 데이터 모델 -> API -> 고객 예약 MVP -> 관리자 MVP -> polish 순서로 개발합니다.
- 각 단계는 동작 가능한 작은 단위로 끝냅니다.
- 예약 생성/마감/관리자 수정은 테스트 우선순위를 높게 둡니다.

## Practical Build Order

이 프로젝트는 한 번에 전부 붙이는 방식보다, 작은 파츠를 먼저 완성하고 직접 점검한 뒤 다음 파츠로 넘어가는 식으로 개발합니다.

### Slice 1. Brand Shell

- 홈 타이틀, 컬러, 폰트, 히어로 분위기
- 상단 공지 바
- 기본 헤더/푸터
- 아직 API 없이 mock 데이터로 확인

### Slice 2. Menu Surface

- 이번 주 메뉴 카드
- 카테고리, 가격, 대표 사진
- 카드 밀도와 사진 톤 점검
- 고객이 메뉴를 보고 예약 주문으로 자연스럽게 넘어가는지 확인
- 아직 API 없이 mock 데이터로 확인

### Slice 3. Reservation UX Shell

- 메뉴 선택 -> 픽업 가능일 선택 흐름
- 예약 가능일 캘린더 UI
- 예약 폼과 완료 화면 흐름
- 아직 제출은 mock 처리

### Slice 4. Backend Skeleton

- `Cloudflare Workers + Hono` 기본 라우트
- `GET /api/health`
- 관리자 auth 기본 골격
- 에러 포맷, validation, env/binding 구조 확정

### Slice 5. Minimal Data Layer

- `D1` 최소 테이블 구성
- `menus`
- `pickup_days`
- `day_menu_inventory`
- `reservations`
- `reservation_items`

### Slice 6. Media Guard

- private `R2` bucket 연결
- `MEDIA_BUCKET` Worker binding
- R2 object metadata D1 저장
- 월별 storage/Class A/Class B 안전 한도 ledger
- public bucket 없이 `/api/media/*`로만 이미지 제공

### Slice 7. Admin Media Upload

- 관리자 메뉴 이미지 업로드 API
- 업로드 전 R2 budget guard
- 업로드 성공 시 `items.image_key`, `items.image_url` 연결
- hourly R2 analytics sync 준비

### Slice 8. Admin MVP

- 마이페이지 내 정보 확인/수정
- 회원 픽업 예약 조회
- Admin 계정 로그인 후 관리자 페이지 분기
- 회원 조회
- 픽업 가능 요일/시간과 예외 규칙 관리
- 메뉴 추가/수정/삭제
- 예약 목록/상태 변경
- 계좌이체 입금 확인 후 주문 확정

### Slice 9. Cloudflare Deployment

- `Pages`: 프론트 배포
- `Workers`: API 배포
- `D1`: 스키마와 seed 반영
- `R2`: private media bucket 운영

Cloudflare는 초반부터 모든 설정을 먼저 끝내기보다, 로컬에서 한 slice가 검증될 때마다 필요한 자원만 붙이는 방식으로 진행합니다.

## Current Cloudflare Note

기준 시점: `2026-07-07`, `Asia/Seoul (GMT+9)`

- Cloudflare 계정 생성 및 대시보드 진입 완료
- `Workers`, `D1`, `R2`는 원격 Cloudflare에 연결되어 있습니다
- `R2`는 public access 없이 Worker API 뒤에 둡니다

## MVP Definition

MVP는 다음을 만족하면 완료로 봅니다.

- 고객이 예약 가능일을 보고 날짜를 선택할 수 있습니다.
- 고객이 메뉴를 보고 픽업 가능일과 수량을 선택할 수 있습니다.
- 고객이 연락처/요청사항을 입력해 예약 주문을 만들 수 있습니다.
- 예약 완료 화면에서 주문 내용을 확인할 수 있습니다.
- 관리자가 날짜별 예약 가능 여부와 메뉴를 수정할 수 있습니다.
- 관리자가 예약 목록과 상태를 확인/변경할 수 있습니다.
- 서버가 가격, 수량, 마감 여부를 검증합니다.

## Non-goals for MVP

- 실시간 카드 결제
- 복잡한 회원 등급/쿠폰/마일리지
- 전국 배송
- 대량 B2B 주문 견적
- POS 연동
- 재료 원가/생산 계획 자동화

이 항목들은 예약 운영이 안정된 뒤 단계적으로 검토합니다.

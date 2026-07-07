# Backend Architecture

## Goals

- 예약 가능 여부, 가격, 수량, 관리자 권한을 서버에서 신뢰성 있게 처리합니다.
- 작은 프로젝트에 맞게 API는 단순하지만, 예약 무결성은 강하게 지킵니다.
- TereneHandover의 DB/API/알림 분리를 참고하되 Cloudflare Workers 환경에 맞게 통합합니다.

## Runtime

- Cloudflare Workers
- Hono
- Drizzle ORM
- Cloudflare D1
- Cloudflare R2
- Zod

## Proposed Worker Structure

```txt
worker/
  index.ts
  routes/
    public.routes.ts
    reservations.routes.ts
    admin.routes.ts
    uploads.routes.ts
  db/
    schema.ts
    client.ts
    migrations/
  services/
    availability.service.ts
    menu.service.ts
    reservation.service.ts
    admin.service.ts
    upload.service.ts
  middleware/
    auth.middleware.ts
    error.middleware.ts
    validation.middleware.ts
  utils/
    dates.ts
    money.ts
    ids.ts
```

## Core Services

- Availability Service: 예약 가능일, 날짜 상태, 픽업 시간, 주문 마감 검증
- Menu Service: 메뉴 목록, 등록/수정, 품절 처리, 이미지 key 관리
- Reservation Service: 예약 생성, 상세/목록 조회, 상태 변경, 총액 계산, 재고 차감
- Admin Service: 로그인, 세션 검증, 비밀번호 해시 검증, audit log 기록

## Reservation Concurrency

- 예약 생성과 수량 차감은 가능한 한 같은 DB 작업 흐름 안에서 처리합니다.
- 차감 조건에 `remaining_quantity >= requested_quantity`를 포함합니다.
- 차감 성공 row count를 확인한 뒤 예약을 확정합니다.
- 실패하면 품절 또는 마감 응답을 반환합니다.

## Error Model

```txt
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
DATE_CLOSED
DEADLINE_PASSED
OUT_OF_STOCK
CONFLICT
INTERNAL_ERROR
```

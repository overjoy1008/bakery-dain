# API Contract Plan

## Principles

- Public API와 Admin API를 명확히 분리합니다.
- 모든 mutation은 서버 검증을 거칩니다.
- 응답은 프론트가 바로 화면에 표시할 수 있는 형태로 정규화합니다.
- 에러 코드는 UI 문구 매핑이 가능하도록 안정적으로 유지합니다.

## Public Endpoints

```txt
GET  /api/public/site
GET  /api/public/menus
GET  /api/public/pickup-rules
GET  /api/auth/username/check
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
PATCH /api/users/me
GET   /api/users/me/reservations
GET   /api/users/me/reservations/:id
POST /api/reservations
GET  /api/reservations/:reservationNumber
GET  /api/media/*
```

## Admin Endpoints

```txt
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/me

GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id

GET    /api/admin/menus
POST   /api/admin/menus
PATCH  /api/admin/menus/:id
DELETE /api/admin/menus/:id

GET    /api/admin/pickup-rules
PUT    /api/admin/pickup-rules
GET    /api/admin/pickup-exceptions
POST   /api/admin/pickup-exceptions
PATCH  /api/admin/pickup-exceptions/:id
DELETE /api/admin/pickup-exceptions/:id

GET   /api/admin/reservations
GET   /api/admin/reservations/:id
PATCH /api/admin/reservations/:id/status
PATCH /api/admin/reservations/:id/admin-note

POST /api/admin/uploads/menu-image
GET  /api/admin/media/usage
POST /api/admin/media/usage/sync
POST /api/admin/media/menu-image
DELETE /api/admin/media/object/*
```

## Reservation Create Request

```json
{
  "pickupDate": "2026-07-13",
  "pickupTime": "14:00",
  "items": [
    { "menuId": "menu_123", "quantity": 2 }
  ],
  "customer": {
    "name": "홍길동",
    "phone": "010-0000-0000"
  },
  "memo": "선물 포장 부탁드려요.",
  "agreements": {
    "privacy": true,
    "pickupPolicy": true
  }
}
```

## Reservation Create Response

```json
{
  "reservationNumber": "BD-260713-0001",
  "status": "payment_pending",
  "pickupDate": "2026-07-13",
  "pickupTime": "14:00",
  "items": [
    {
      "menuName": "호두파이",
      "quantity": 2,
      "unitPrice": 18000,
      "lineTotal": 36000
    }
  ],
  "totalAmount": 36000,
  "notice": "픽업 시간에 맞춰 방문해 주세요."
}
```

## Status Values

### Pickup Day

```txt
available
limited
closed
day_off
hidden
```

### Reservation

```txt
payment_pending
payment_confirmed
making
pickup_ready
picked_up
cancelled
```

## Error Response

```json
{
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "선택한 메뉴의 남은 수량이 부족해요.",
    "details": {
      "menuId": "menu_123",
      "remainingQuantity": 1
    }
  }
}
```

# System Architecture

## Overview

```txt
Cloudflare Pages
  React customer/admin frontend

Cloudflare Workers
  Hono API
  Auth middleware
  Reservation service
  Admin service
  Image upload signing

Cloudflare D1
  menus
  pickup_days
  day_menu_inventory
  reservations
  reservation_items
  admin_users
  audit_logs

Cloudflare R2
  product images
  hero images
```

## Deployment Units

- Frontend: Cloudflare Pages
- API: Cloudflare Workers
- Database: Cloudflare D1
- Object Storage: Cloudflare R2

## Reservation Create Flow

```txt
Customer submits reservation
  -> Worker validates payload with Zod
  -> Worker reads pickup day and inventory
  -> Worker verifies deadline and quantity
  -> Worker computes trusted total price
  -> Worker creates reservation and reservation_items
  -> Worker decrements inventory
  -> Worker returns receipt payload
```

## Security Boundaries

- 관리자 화면은 정적 파일로 노출될 수 있으므로, 모든 민감 작업은 API 인증을 요구합니다.
- 관리자 토큰은 짧은 만료 시간과 refresh 전략을 둡니다.
- 예약 가격과 수량은 서버에서만 확정합니다.
- 이미지 업로드는 관리자 권한과 파일 타입/용량 검증을 거칩니다.

## TereneHandover Adaptation

- Calendar components -> pickup day calendar
- Receipt components -> preorder receipt
- Admin settings -> bakery availability settings
- Orders table -> reservations table
- Notifier queue -> optional lightweight notification flow

# Database Plan

## Principles

- 예약 도메인을 중심으로 작게 시작합니다.
- 메뉴, 날짜, 날짜별 메뉴 수량, 예약, 예약 아이템을 분리합니다.
- 고객 개인정보는 예약 처리에 필요한 최소 정보만 저장합니다.
- 이미지 파일은 R2에 저장하고 DB에는 key/URL만 저장합니다.

## Core Tables

### `menus`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| name | text | menu name |
| slug | text | unique |
| category | text | baked, tart, cookie, jam, gift |
| description | text | short card copy |
| price | integer | KRW |
| image_key | text | R2 object key |
| is_active | integer | boolean |
| is_sold_out | integer | global sold-out |
| sort_order | integer | display order |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

### `pickup_days`

| Column | Type | Notes |
| --- | --- | --- |
| date | text | YYYY-MM-DD primary key |
| status | text | available, limited, closed, day_off, hidden |
| pickup_start_time | text | HH:mm |
| pickup_end_time | text | HH:mm |
| order_deadline_at | text | ISO datetime |
| note | text | admin/customer note |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

### `day_menu_inventory`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| date | text | references pickup_days.date |
| menu_id | text | references menus.id |
| total_quantity | integer | opened quantity |
| remaining_quantity | integer | available quantity |
| is_available | integer | date-level availability |
| sort_order | integer | date display order |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

### `reservations`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| reservation_number | text | unique customer-facing number |
| status | text | submitted, confirmed, preparing, ready, picked_up, cancelled |
| pickup_date | text | YYYY-MM-DD |
| pickup_time | text | HH:mm |
| customer_name | text | minimal PII |
| customer_phone | text | minimal PII |
| memo | text | optional request |
| total_amount | integer | server-calculated KRW |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

### `reservation_items`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| reservation_id | text | references reservations.id |
| menu_id | text | references menus.id |
| menu_name_snapshot | text | preserve historical name |
| unit_price_snapshot | integer | preserve historical price |
| quantity | integer | ordered quantity |
| line_total | integer | server-calculated |

### `admin_users`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| email | text | unique |
| password_hash | text | hashed password |
| role | text | owner/admin |
| created_at | text | ISO datetime |
| updated_at | text | ISO datetime |

### `audit_logs`

| Column | Type | Notes |
| --- | --- | --- |
| id | text | primary key |
| admin_user_id | text | nullable |
| action | text | e.g. pickup_day.updated |
| target_type | text | menu, day, reservation |
| target_id | text | id/date |
| payload_json | text | small JSON snapshot |
| created_at | text | ISO datetime |

## Future Tables

- `payments`
- `notification_logs`
- `discount_codes`
- `customers`
- `site_settings`
- `hero_slides`

## Migration Strategy

- Drizzle schema를 source of truth로 둡니다.
- seed data는 개발용과 운영 초기용을 분리합니다.
- 예약 데이터가 생긴 뒤에는 destructive migration을 피합니다.
- 메뉴 가격은 reservation item snapshot으로 보존합니다.

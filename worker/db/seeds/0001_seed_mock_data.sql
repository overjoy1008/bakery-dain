INSERT OR REPLACE INTO categories (
  id, slug, name, description, sort_order, is_active, created_at, updated_at
) VALUES
  ('cat_tart', 'tart', '타르트/파이', '다닷네의 타르트와 파이 메뉴', 10, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('cat_cookie', 'cookie', '쿠키', '선물하기 좋은 쿠키 메뉴', 20, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('cat_baked', 'baked', '구움과자', '소량 제작 구움과자와 박스', 30, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('cat_seasonal', 'seasonal', '잼/시즌', '계절 재료로 만든 시즌 메뉴', 40, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00');

INSERT OR REPLACE INTO items (
  id, category_id, title, slug, image_key, image_url, description, is_seasonal,
  price, min_prep_days, max_per_person, total_limited_quantity, remaining_limited_quantity,
  is_reservable, sort_order, registered_at, created_at, updated_at
) VALUES
  (
    'itm_walnut_tart',
    'cat_tart',
    '호두 타르트',
    'walnut-tart',
    'menu/2026-07-13/69a257d1-0e24-4ffb-8184-14512658e864-walnut-tart.png',
    '/api/media/menu/2026-07-13/69a257d1-0e24-4ffb-8184-14512658e864-walnut-tart.png',
    '고소한 호두를 듬뿍 올린 다닷네 인기 메뉴',
    0,
    18000,
    5,
    4,
    24,
    24,
    1,
    10,
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00'
  ),
  (
    'itm_choco_cookie',
    'cat_cookie',
    '초코칩 쿠키',
    'choco-cookie',
    'menu/2026-07-13/816d99f3-c284-4fd7-8f30-520f95a49797-choco-cookie.png',
    '/api/media/menu/2026-07-13/816d99f3-c284-4fd7-8f30-520f95a49797-choco-cookie.png',
    '큼직한 초코칩을 넣어 선물하기 좋은 쿠키',
    0,
    5600,
    3,
    8,
    80,
    80,
    1,
    20,
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00'
  ),
  (
    'itm_financier_box',
    'cat_baked',
    '구움과자 박스',
    'financier-box',
    'menu/2026-07-13/ee3e4896-23c4-496c-bd7c-332c85a4bb14-financier-box.png',
    '/api/media/menu/2026-07-13/ee3e4896-23c4-496c-bd7c-332c85a4bb14-financier-box.png',
    '휘낭시에를 조금씩 담은 이번 주 선물 세트',
    0,
    24000,
    4,
    3,
    18,
    18,
    1,
    30,
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00'
  ),
  (
    'itm_strawberry_jam',
    'cat_seasonal',
    '딸기잼',
    'strawberry-jam',
    'menu/2026-07-13/b1115112-26ea-4689-8513-6e4433caf473-strawberry-jam.png',
    '/api/media/menu/2026-07-13/b1115112-26ea-4689-8513-6e4433caf473-strawberry-jam.png',
    '계절 딸기를 작게 끓여 만든 홈메이드 잼',
    1,
    10400,
    3,
    6,
    36,
    36,
    1,
    40,
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00',
    '2026-07-08T00:00:00+09:00'
  );

INSERT OR REPLACE INTO pickup_rules (
  id, available_weekdays_json, default_time_slots_json, daily_capacity, is_active, created_at, updated_at
) VALUES (
  'default',
  '[1,2,3,4,5]',
  '["14:00","16:00","18:00"]',
  18,
  1,
  '2026-07-08T00:00:00+09:00',
  '2026-07-08T00:00:00+09:00'
);

INSERT OR REPLACE INTO pickup_exceptions (
  id, date, exception_type, time_slots_json, reason, created_by_user_id, created_at, updated_at
) VALUES
  ('pex_20260713', '2026-07-13', 'unavailable', NULL, '운영자 픽업 불가일', NULL, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('pex_20260720', '2026-07-20', 'unavailable', NULL, '운영자 픽업 불가일', NULL, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('pex_wednesday_hours', '2026-07-15', 'custom_hours', '["13:00","15:00","17:00"]', '수요일 픽업 시간 조정', NULL, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('pex_friday_hours', '2026-07-17', 'custom_hours', '["13:00","16:00"]', '금요일 픽업 시간 조정', NULL, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00');

INSERT OR REPLACE INTO site_notice_items (
  id, text, icon_label, href, sort_order, starts_at, ends_at, is_active, created_at, updated_at
) VALUES
  ('not_weekly_open', '이번 주 예약 오픈', NULL, NULL, 10, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('not_pickup_check', '픽업일을 확인해 주세요', NULL, NULL, 20, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('not_small_batch', '소량만 구워요', NULL, NULL, 30, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('not_gift_wrap', '선물 포장 가능', NULL, NULL, 40, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('not_seasonal', '계절 재료로 만들어요', NULL, NULL, 50, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00');

INSERT OR REPLACE INTO featured_items (
  id, item_id, placement, title_override, description_override, sort_order, starts_at, ends_at,
  is_active, created_at, updated_at
) VALUES
  ('fit_home_walnut_tart', 'itm_walnut_tart', 'home', NULL, NULL, 10, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('fit_home_choco_cookie', 'itm_choco_cookie', 'home', NULL, NULL, 20, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('fit_home_financier_box', 'itm_financier_box', 'home', NULL, NULL, 30, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('fit_dashboard_walnut_tart', 'itm_walnut_tart', 'dashboard', '대표 인기 메뉴', NULL, 10, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00'),
  ('fit_dashboard_financier_box', 'itm_financier_box', 'dashboard', '이번 주 선물 세트', NULL, 20, NULL, NULL, 1, '2026-07-08T00:00:00+09:00', '2026-07-08T00:00:00+09:00');

INSERT OR REPLACE INTO coupons (
  id, code, title, coupon_type, discount_value, min_order_amount, max_discount_amount,
  starts_at, ends_at, usage_limit_total, usage_limit_per_user, used_count, is_active, created_at, updated_at
) VALUES (
  'cpn_welcome_1000',
  'WELCOME1000',
  '첫 예약 감사 쿠폰',
  'fixed_amount',
  1000,
  10000,
  NULL,
  '2026-07-08T00:00:00+09:00',
  NULL,
  100,
  1,
  0,
  1,
  '2026-07-08T00:00:00+09:00',
  '2026-07-08T00:00:00+09:00'
);

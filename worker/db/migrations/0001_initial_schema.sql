PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('member', 'guest', 'admin')),
  site_username TEXT UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  is_phone_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_phone_verified IN (0, 1)),
  is_email_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_email_verified IN (0, 1)),
  mileage_points INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_key TEXT,
  image_url TEXT,
  description TEXT NOT NULL,
  is_seasonal INTEGER NOT NULL DEFAULT 0 CHECK (is_seasonal IN (0, 1)),
  price INTEGER NOT NULL CHECK (price >= 0),
  min_prep_days INTEGER NOT NULL DEFAULT 3 CHECK (min_prep_days >= 0),
  max_per_person INTEGER NOT NULL DEFAULT 6 CHECK (max_per_person > 0),
  total_limited_quantity INTEGER CHECK (total_limited_quantity IS NULL OR total_limited_quantity >= 0),
  remaining_limited_quantity INTEGER CHECK (remaining_limited_quantity IS NULL OR remaining_limited_quantity >= 0),
  is_reservable INTEGER NOT NULL DEFAULT 1 CHECK (is_reservable IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  registered_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  reservation_number TEXT NOT NULL UNIQUE,
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('guest', 'member')),
  user_id TEXT NOT NULL REFERENCES users(id),
  pickup_date TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  request_note TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('payment_pending', 'payment_confirmed', 'making', 'pickup_ready', 'picked_up', 'cancelled')
  ),
  total_item_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_item_amount >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_payment_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_payment_amount >= 0),
  payment_pending_at TEXT,
  payment_confirmed_at TEXT,
  making_started_at TEXT,
  pickup_ready_at TEXT,
  picked_up_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation_items (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_title_snapshot TEXT NOT NULL,
  item_image_key_snapshot TEXT,
  unit_price_snapshot INTEGER NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer')),
  payer_name TEXT NOT NULL,
  payer_phone TEXT,
  bank_name TEXT,
  bank_account_last4 TEXT,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (
    status IN ('payment_pending', 'payment_confirmed', 'refund_pending', 'refunded', 'cancelled')
  ),
  payment_pending_at TEXT,
  payment_confirmed_at TEXT,
  refund_pending_at TEXT,
  refunded_at TEXT,
  cancelled_at TEXT,
  admin_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('fixed_amount', 'percent')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount INTEGER CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  starts_at TEXT,
  ends_at TEXT,
  usage_limit_total INTEGER CHECK (usage_limit_total IS NULL OR usage_limit_total > 0),
  usage_limit_per_user INTEGER CHECK (usage_limit_per_user IS NULL OR usage_limit_per_user > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation_coupons (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  coupon_id TEXT NOT NULL REFERENCES coupons(id),
  code_snapshot TEXT NOT NULL,
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pickup_rules (
  id TEXT PRIMARY KEY,
  available_weekdays_json TEXT NOT NULL,
  default_time_slots_json TEXT NOT NULL,
  daily_capacity INTEGER CHECK (daily_capacity IS NULL OR daily_capacity > 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pickup_exceptions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('unavailable', 'custom_hours')),
  time_slots_json TEXT,
  reason TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_notice_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  icon_label TEXT,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS featured_items (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  placement TEXT NOT NULL CHECK (placement IN ('home', 'dashboard')),
  title_override TEXT,
  description_override TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_site_username ON users(site_username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id, is_reservable, sort_order);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_pickup ON reservations(pickup_date, pickup_time, status);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pickup_exceptions_date ON pickup_exceptions(date);
CREATE INDEX IF NOT EXISTS idx_site_notice_active ON site_notice_items(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_items_placement ON featured_items(placement, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id, created_at);

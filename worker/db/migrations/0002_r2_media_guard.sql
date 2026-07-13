PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS r2_objects (
  key TEXT PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('menu_item', 'site_asset', 'admin_upload')),
  owner_id TEXT,
  original_filename TEXT,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  etag TEXT,
  public_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_by_admin_username TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS r2_usage_monthly (
  month_key TEXT PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  storage_bytes_estimated INTEGER NOT NULL DEFAULT 0 CHECK (storage_bytes_estimated >= 0),
  class_a_used INTEGER NOT NULL DEFAULT 0 CHECK (class_a_used >= 0),
  class_b_used INTEGER NOT NULL DEFAULT 0 CHECK (class_b_used >= 0),
  actual_storage_bytes INTEGER NOT NULL DEFAULT 0 CHECK (actual_storage_bytes >= 0),
  actual_class_a_used INTEGER NOT NULL DEFAULT 0 CHECK (actual_class_a_used >= 0),
  actual_class_b_used INTEGER NOT NULL DEFAULT 0 CHECK (actual_class_b_used >= 0),
  storage_limit_bytes INTEGER NOT NULL,
  class_a_limit INTEGER NOT NULL,
  class_b_limit INTEGER NOT NULL,
  reads_blocked_at TEXT,
  writes_blocked_at TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS r2_usage_events (
  id TEXT PRIMARY KEY,
  month_key TEXT NOT NULL REFERENCES r2_usage_monthly(month_key) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  operation_class TEXT NOT NULL CHECK (operation_class IN ('A', 'B', 'free')),
  action_type TEXT NOT NULL,
  object_key TEXT,
  operation_count INTEGER NOT NULL DEFAULT 1 CHECK (operation_count > 0),
  storage_delta_bytes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'success', 'failed', 'blocked', 'synced')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_r2_objects_owner ON r2_objects(owner_type, owner_id, status);
CREATE INDEX IF NOT EXISTS idx_r2_usage_events_month ON r2_usage_events(month_key, created_at);

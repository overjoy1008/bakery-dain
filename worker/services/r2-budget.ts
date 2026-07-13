import type { WorkerEnv } from "../types";
import { HttpError } from "../utils/http-error";

export const MEDIA_BUCKET_NAME = "bakery-dain-media";
export const R2_STORAGE_LIMIT_BYTES = 8 * 1024 * 1024 * 1024;
export const R2_CLASS_A_LIMIT = 800_000;
export const R2_CLASS_B_LIMIT = 8_000_000;
export const R2_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const classAActionTypes = new Set([
  "ListBuckets",
  "PutBucket",
  "ListObjects",
  "PutObject",
  "CopyObject",
  "CompleteMultipartUpload",
  "CreateMultipartUpload",
  "LifecycleStorageTierTransition",
  "ListMultipartUploads",
  "UploadPart",
  "UploadPartCopy",
  "ListParts",
  "PutBucketEncryption",
  "PutBucketCors",
  "PutBucketLifecycleConfiguration",
]);

const classBActionTypes = new Set([
  "HeadBucket",
  "HeadObject",
  "GetObject",
  "UsageSummary",
  "GetBucketEncryption",
  "GetBucketLocation",
  "GetBucketCors",
  "GetBucketLifecycleConfiguration",
]);

type UsageRow = {
  actual_class_a_used: number;
  actual_class_b_used: number;
  actual_storage_bytes: number;
  class_a_limit: number;
  class_a_used: number;
  class_b_limit: number;
  class_b_used: number;
  month_key: string;
  storage_bytes_estimated: number;
  storage_limit_bytes: number;
};

type ReserveInput = {
  actionType: string;
  classA?: number;
  classB?: number;
  objectKey?: string;
  storageDeltaBytes?: number;
};

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function ensureUsageMonth(env: WorkerEnv, monthKey = getCurrentMonthKey()) {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO r2_usage_monthly (
       month_key, bucket_name, storage_limit_bytes, class_a_limit, class_b_limit, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      monthKey,
      MEDIA_BUCKET_NAME,
      R2_STORAGE_LIMIT_BYTES,
      R2_CLASS_A_LIMIT,
      R2_CLASS_B_LIMIT,
      now,
      now,
    )
    .run();
}

export async function getR2Usage(env: WorkerEnv, monthKey = getCurrentMonthKey()) {
  await ensureUsageMonth(env, monthKey);

  const usage = await env.DB.prepare(
    `SELECT
       month_key, storage_bytes_estimated, class_a_used, class_b_used,
       actual_storage_bytes, actual_class_a_used, actual_class_b_used,
       storage_limit_bytes, class_a_limit, class_b_limit
     FROM r2_usage_monthly
     WHERE month_key = ?
     LIMIT 1`,
  )
    .bind(monthKey)
    .first<UsageRow>();

  if (!usage) {
    throw new HttpError(500, "INTERNAL_ERROR", "R2 사용량 ledger를 읽지 못했어요.");
  }

  return usage;
}

export function toR2UsageSummary(usage: UsageRow) {
  const effectiveStorageBytes = Math.max(
    usage.storage_bytes_estimated,
    usage.actual_storage_bytes,
  );
  const effectiveClassA = Math.max(usage.class_a_used, usage.actual_class_a_used);
  const effectiveClassB = Math.max(usage.class_b_used, usage.actual_class_b_used);

  return {
    bucketName: MEDIA_BUCKET_NAME,
    classA: {
      actual: usage.actual_class_a_used,
      effective: effectiveClassA,
      ledger: usage.class_a_used,
      limit: usage.class_a_limit,
      remaining: Math.max(0, usage.class_a_limit - effectiveClassA),
    },
    classB: {
      actual: usage.actual_class_b_used,
      effective: effectiveClassB,
      ledger: usage.class_b_used,
      limit: usage.class_b_limit,
      remaining: Math.max(0, usage.class_b_limit - effectiveClassB),
    },
    monthKey: usage.month_key,
    storage: {
      actualBytes: usage.actual_storage_bytes,
      effectiveBytes: effectiveStorageBytes,
      estimatedBytes: usage.storage_bytes_estimated,
      limitBytes: usage.storage_limit_bytes,
      remainingBytes: Math.max(0, usage.storage_limit_bytes - effectiveStorageBytes),
    },
  };
}

export async function reserveR2Budget(env: WorkerEnv, input: ReserveInput) {
  const monthKey = getCurrentMonthKey();
  const now = new Date().toISOString();
  const classA = input.classA ?? 0;
  const classB = input.classB ?? 0;
  const storageDeltaBytes = input.storageDeltaBytes ?? 0;

  await ensureUsageMonth(env, monthKey);

  const usage = await getR2Usage(env, monthKey);
  const effectiveClassA = Math.max(usage.class_a_used, usage.actual_class_a_used);
  const effectiveClassB = Math.max(usage.class_b_used, usage.actual_class_b_used);
  const effectiveStorage = Math.max(usage.storage_bytes_estimated, usage.actual_storage_bytes);
  const wouldExceedClassA = effectiveClassA + classA > usage.class_a_limit;
  const wouldExceedClassB = effectiveClassB + classB > usage.class_b_limit;
  const wouldExceedStorage = effectiveStorage + storageDeltaBytes > usage.storage_limit_bytes;

  if (wouldExceedClassA || wouldExceedClassB || wouldExceedStorage) {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE r2_usage_monthly
         SET
           reads_blocked_at = CASE WHEN ? = 1 THEN ? ELSE reads_blocked_at END,
           writes_blocked_at = CASE WHEN ? = 1 THEN ? ELSE writes_blocked_at END,
           updated_at = ?
         WHERE month_key = ?`,
      ).bind(
        wouldExceedClassB ? 1 : 0,
        now,
        wouldExceedClassA || wouldExceedStorage ? 1 : 0,
        now,
        now,
        monthKey,
      ),
      env.DB.prepare(
        `INSERT INTO r2_usage_events (
           id, month_key, bucket_name, operation_class, action_type, object_key,
           operation_count, storage_delta_bytes, status, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'blocked', ?)`,
      ).bind(
        crypto.randomUUID(),
        monthKey,
        MEDIA_BUCKET_NAME,
        classA > 0 ? "A" : classB > 0 ? "B" : "free",
        input.actionType,
        input.objectKey ?? null,
        Math.max(classA, classB, 1),
        storageDeltaBytes,
        now,
      ),
    ]);

    throw new HttpError(
      429,
      "USAGE_LIMIT_EXCEEDED",
      "이번 달 이미지 저장소 안전 한도에 가까워져 작업을 막았어요.",
      {
        classA: effectiveClassA,
        classB: effectiveClassB,
        storageBytes: effectiveStorage,
      },
    );
  }

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE r2_usage_monthly
       SET
         class_a_used = class_a_used + ?,
         class_b_used = class_b_used + ?,
         storage_bytes_estimated = storage_bytes_estimated + ?,
         updated_at = ?
       WHERE month_key = ?`,
    ).bind(classA, classB, storageDeltaBytes, now, monthKey),
    env.DB.prepare(
      `INSERT INTO r2_usage_events (
         id, month_key, bucket_name, operation_class, action_type, object_key,
         operation_count, storage_delta_bytes, status, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?)`,
    ).bind(
      crypto.randomUUID(),
      monthKey,
      MEDIA_BUCKET_NAME,
      classA > 0 ? "A" : classB > 0 ? "B" : "free",
      input.actionType,
      input.objectKey ?? null,
      Math.max(classA, classB, 1),
      storageDeltaBytes,
      now,
    ),
  ]);
}

export function classifyR2Action(actionType: string) {
  if (classAActionTypes.has(actionType)) {
    return "A";
  }

  if (classBActionTypes.has(actionType)) {
    return "B";
  }

  return "free";
}


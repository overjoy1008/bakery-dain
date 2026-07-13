import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";
import {
  MEDIA_BUCKET_NAME,
  R2_MAX_IMAGE_BYTES,
  getR2Usage,
  reserveR2Budget,
  toR2UsageSummary,
} from "../services/r2-budget";
import { syncR2UsageFromCloudflare } from "../services/r2-analytics";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const mediaRoutes = new Hono<AppBindings>();
export const adminMediaRoutes = new Hono<AppBindings>();

function getMediaKeyFromRequest(request: Request) {
  const pathname = new URL(request.url).pathname;
  const encodedKey = pathname.replace(/^\/api\/media\/?/, "");

  try {
    return decodeURIComponent(encodedKey);
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "이미지 경로를 확인해 주세요.");
  }
}

function getAdminObjectKeyFromRequest(request: Request) {
  const pathname = new URL(request.url).pathname;
  const encodedKey = pathname.replace(/^\/api\/admin\/media\/object\/?/, "");

  try {
    return decodeURIComponent(encodedKey);
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "이미지 경로를 확인해 주세요.");
  }
}

function assertValidR2Key(key: string) {
  const isInvalid =
    !key ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.length > 1024 ||
    !/^[a-zA-Z0-9/_.,=-]+$/.test(key);

  if (isInvalid) {
    throw new HttpError(400, "VALIDATION_ERROR", "이미지 경로를 확인해 주세요.");
  }
}

function sanitizeFilename(filename: string) {
  const fallback = "image";
  const safeName = filename
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return safeName || fallback;
}

function createMediaKey(file: File) {
  const today = new Date().toISOString().slice(0, 10);
  return `menu/${today}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
}

function isUploadFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

mediaRoutes.get("*", async (context) => {
  const key = getMediaKeyFromRequest(context.req.raw);
  assertValidR2Key(key);

  const cache = caches.default;
  const cacheKey = new Request(context.req.url, context.req.raw);
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  await reserveR2Budget(context.env, {
    actionType: "GetObject",
    classB: 1,
    objectKey: key,
  });

  const object = await context.env.MEDIA_BUCKET.get(key);

  if (!object) {
    throw new HttpError(404, "NOT_FOUND", "이미지를 찾을 수 없어요.");
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");

  const response = new Response(object.body, {
    headers,
    status: 200,
  });

  context.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

adminMediaRoutes.use("*", requireAdmin);

adminMediaRoutes.get("/usage", async (context) => {
  const usage = await getR2Usage(context.env);

  return context.json({
    usage: toR2UsageSummary(usage),
  });
});

adminMediaRoutes.post("/usage/sync", async (context) => {
  const result = await syncR2UsageFromCloudflare(context.env);

  return context.json(result);
});

adminMediaRoutes.post("/menu-image", async (context) => {
  const formData = await context.req.formData();
  const file = formData.get("file");
  const itemId = formData.get("itemId");

  if (!isUploadFile(file)) {
    throw new HttpError(400, "VALIDATION_ERROR", "업로드할 이미지 파일을 선택해 주세요.");
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new HttpError(400, "VALIDATION_ERROR", "jpg, png, webp, gif 이미지만 업로드할 수 있어요.");
  }

  if (file.size <= 0 || file.size > R2_MAX_IMAGE_BYTES) {
    throw new HttpError(400, "VALIDATION_ERROR", "이미지는 5MB 이하로 업로드해 주세요.");
  }

  const key = createMediaKey(file);
  const publicPath = `/api/media/${key}`;
  const now = new Date().toISOString();
  const arrayBuffer = await file.arrayBuffer();
  const ownerId = typeof itemId === "string" && itemId.trim() ? itemId.trim() : null;

  if (ownerId) {
    const item = await context.env.DB.prepare(
      `SELECT id
       FROM items
       WHERE id = ?
       LIMIT 1`,
    )
      .bind(ownerId)
      .first<{ id: string }>();

    if (!item) {
      throw new HttpError(404, "NOT_FOUND", "이미지를 연결할 메뉴를 찾을 수 없어요.");
    }
  }

  await reserveR2Budget(context.env, {
    actionType: "PutObject",
    classA: 1,
    objectKey: key,
    storageDeltaBytes: file.size,
  });

  let uploadedObject: R2Object | null = null;

  try {
    uploadedObject = await context.env.MEDIA_BUCKET.put(key, arrayBuffer, {
      customMetadata: {
        bucketName: MEDIA_BUCKET_NAME,
        uploadedBy: context.get("adminUser")?.username ?? "admin",
      },
      httpMetadata: {
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        contentType: file.type,
      },
      storageClass: "Standard",
    });
  } catch (error) {
    await context.env.DB.prepare(
      `UPDATE r2_usage_monthly
       SET storage_bytes_estimated = max(0, storage_bytes_estimated - ?), updated_at = ?
       WHERE month_key = ?`,
    )
      .bind(
        file.size,
        new Date().toISOString(),
        `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`,
      )
      .run();

    throw error;
  }

  const adminUsername = context.get("adminUser")?.username ?? "admin";
  const statements = [
    context.env.DB.prepare(
      `INSERT INTO r2_objects (
         key, bucket_name, owner_type, owner_id, original_filename, content_type, byte_size,
         etag, public_path, status, created_by_admin_username, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    ).bind(
      key,
      MEDIA_BUCKET_NAME,
      ownerId ? "menu_item" : "admin_upload",
      ownerId,
      file.name,
      file.type,
      file.size,
      uploadedObject?.httpEtag ?? null,
      publicPath,
      adminUsername,
      now,
      now,
    ),
  ];

  if (ownerId) {
    statements.push(
      context.env.DB.prepare(
        `UPDATE items
         SET image_key = ?, image_url = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(key, publicPath, now, ownerId),
    );
  }

  await context.env.DB.batch(statements);

  return context.json(
    {
      media: {
        bucketName: MEDIA_BUCKET_NAME,
        contentType: file.type,
        key,
        publicPath,
        size: file.size,
      },
    },
    201,
  );
});

adminMediaRoutes.delete("/object/*", async (context) => {
  const key = getAdminObjectKeyFromRequest(context.req.raw);
  assertValidR2Key(key);

  const objectRow = await context.env.DB.prepare(
    `SELECT key, byte_size
     FROM r2_objects
     WHERE key = ? AND status = 'active'
     LIMIT 1`,
  )
    .bind(key)
    .first<{ byte_size: number; key: string }>();

  if (!objectRow) {
    throw new HttpError(404, "NOT_FOUND", "삭제할 이미지를 찾을 수 없어요.");
  }

  const now = new Date().toISOString();
  const monthKey = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;

  await context.env.MEDIA_BUCKET.delete(key);
  const mediaUrl = new URL(`/api/media/${key}`, context.req.url).toString();
  context.executionCtx.waitUntil(caches.default.delete(new Request(mediaUrl)));

  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE r2_objects
       SET status = 'deleted', deleted_at = ?, updated_at = ?
       WHERE key = ?`,
    ).bind(now, now, key),
    context.env.DB.prepare(
      `UPDATE r2_usage_monthly
       SET storage_bytes_estimated = max(0, storage_bytes_estimated - ?), updated_at = ?
       WHERE month_key = ?`,
    ).bind(objectRow.byte_size, now, monthKey),
    context.env.DB.prepare(
      `INSERT INTO r2_usage_events (
         id, month_key, bucket_name, operation_class, action_type, object_key,
         operation_count, storage_delta_bytes, status, created_at
       )
       VALUES (?, ?, ?, 'free', 'DeleteObject', ?, 1, ?, 'success', ?)`,
    ).bind(
      crypto.randomUUID(),
      monthKey,
      MEDIA_BUCKET_NAME,
      key,
      -objectRow.byte_size,
      now,
    ),
    context.env.DB.prepare(
      `UPDATE items
       SET image_key = NULL, image_url = NULL, updated_at = ?
       WHERE image_key = ?`,
    ).bind(now, key),
  ]);

  return context.json({
    deleted: true,
    key,
  });
});

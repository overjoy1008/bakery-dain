# Slice 6-7. R2 Media Guard

## Scope

Slice 6-7 connects the production Cloudflare R2 bucket without making it public.

- R2 bucket binding: `MEDIA_BUCKET`
- Bucket name: `bakery-dain-media`
- Public image reads go through `GET /api/media/*`
- Admin image uploads go through `POST /api/admin/media/menu-image`
- D1 tracks R2 object metadata and conservative monthly usage
- Worker blocks R2 reads/writes before the internal free-tier safety limits are exceeded
- Cron attempts hourly R2 analytics sync when `CLOUDFLARE_ANALYTICS_TOKEN` is configured

## Safety Rules

- Do not enable public `r2.dev` access.
- Do not expose S3 credentials to the browser.
- Do not use R2 `list()` for menu display.
- Store menu image references in D1 as `items.image_key` and `items.image_url`.
- Use Standard storage only.

## Internal Monthly Safety Limits

The guard intentionally stays below Cloudflare's free tier.

```txt
Storage: 8 GiB
Class A operations: 800,000
Class B operations: 8,000,000
Max single image upload: 5 MiB
```

## API

```txt
GET  /api/media/*
GET  /api/admin/media/usage
POST /api/admin/media/usage/sync
POST /api/admin/media/menu-image
DELETE /api/admin/media/object/*
```

`POST /api/admin/media/menu-image` accepts `multipart/form-data`.

```txt
file=<image file>
itemId=<optional item id>
```

When `itemId` is provided, the uploaded R2 object is attached to that item.

## Remote Setup

`wrangler.toml` is the source of truth:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "bakery-dain-media"
```

For actual Cloudflare analytics sync, add a secret with permissions to query Analytics GraphQL:

```bash
wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
```

If that secret is missing, the cron job safely skips external sync and keeps using the D1 ledger.

## Remote Verification

Verified on `2026-07-10` against the production Worker:

```txt
Worker: bakery-dain-api
Bucket: bakery-dain-media
Binding: MEDIA_BUCKET
D1: bakery-dain-db
Cron: 17 * * * *
Analytics sync: skipped=false
```

Checked flows:

- Invalid `itemId` upload returns `404`.
- Admin image upload writes to R2 and `r2_objects`.
- `GET /api/media/*` serves the object through Worker proxy.
- `DELETE /api/admin/media/object/*` removes the object and clears estimated storage.
- Usage guard reports D1 ledger and Cloudflare Analytics data together.

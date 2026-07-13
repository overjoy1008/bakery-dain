# Cloudflare Setup

## Current Slice

Slice 4 only needs a Worker.

1. Go to `Workers and Pages`.
2. Create or use the Worker named `bakery-dain-api`.
3. Keep the default `workers.dev` subdomain for now.
4. Add production variables/secrets in the Cloudflare dashboard or with `wrangler secret put`.

```txt
ENVIRONMENT=production
ADMIN_USERNAME=<owner admin id>
ADMIN_PASSWORD=<temporary strong password>
ADMIN_SESSION_TOKEN=<temporary long random token>
```

Do not commit real API tokens, R2 keys, passwords, or session tokens.
Use `.dev.vars` only for local development and keep it ignored.

## Wrangler Deploy Auth

`wrangler deploy` needs a Cloudflare API token when running from a non-interactive terminal.

Recommended token scope for this slice:

- `Account` > `Cloudflare Workers Scripts:Edit`

Use it only as a shell environment variable:

```bash
export CLOUDFLARE_API_TOKEN=<cloudflare api token>
npm run worker:deploy
```

Do not write `CLOUDFLARE_API_TOKEN` into `.dev.vars`; it is for Wrangler, not for the Worker runtime.

## Config Drift

Wrangler deploy uses local `wrangler.toml` as the source of truth for Worker configuration.
If the dashboard has vars or observability settings that are missing locally, Wrangler may warn that deployment will override remote configuration.

For Slice 4, keep stable non-secret config in `wrangler.toml`, and keep secrets in Cloudflare Secrets.

## R2 Media

Slice 6-7 uses a private R2 bucket behind the Worker.

- Bucket: `bakery-dain-media`
- Binding: `MEDIA_BUCKET`
- Public `r2.dev`: keep disabled
- Custom public domain: do not connect yet
- Storage class: Standard

`wrangler.toml` keeps the binding as source of truth:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "bakery-dain-media"
```

The Worker exposes images through `GET /api/media/*` and admin uploads through
`POST /api/admin/media/menu-image`. The API checks the D1 usage ledger before it calls R2.

Optional actual usage sync needs a Cloudflare Analytics token as a Worker secret:

```bash
wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
```

Without that secret, the hourly cron skips GraphQL sync and keeps using the conservative D1 ledger.
The production Worker currently has this secret configured and `/api/admin/media/usage/sync`
returns `skipped=false`.

## Later Slices

Launch:

- Add a domain in Cloudflare.
- Connect the frontend to Cloudflare Pages.
- Set the frontend API base URL to the deployed Worker URL.

## Commands

```bash
npm run worker:check
npm run worker:dev
npm run worker:deploy
```

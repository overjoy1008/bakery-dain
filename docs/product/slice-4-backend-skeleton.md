# Slice 4. Backend Communication

## Scope

Slice 4 opens the API runtime and connects the customer-facing site to the Worker API.

- Cloudflare Workers entrypoint
- Hono app mounted under `/api`
- `GET /api/health`
- Admin auth stub
- Member signup/login API
- Reservation submission API
- Frontend API client using `VITE_API_BASE_URL`
- Shared error response format
- Zod request validation helper
- Worker env typing and Wrangler config

## Endpoints

```txt
GET  /api/health
GET  /api/auth/username/check
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/reservations
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/me
```

## Frontend Connection

The frontend defaults to the deployed Worker:

```txt
VITE_API_BASE_URL=https://bakery-dain-api.overjoy1008.workers.dev/api
```

Menu, notice, pickup rule, signup, login, and reservation creation requests go through the Worker. Browser code never receives Cloudflare API tokens or D1 credentials.

## Admin Auth Stub

Admin login is intentionally simple in this slice.

```txt
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_SESSION_TOKEN
```

`POST /api/admin/auth/login` compares the request body against those env values and returns the configured session token.
`GET /api/admin/me` expects `Authorization: Bearer <ADMIN_SESSION_TOKEN>`.

This is not the final auth implementation. Slice 5/6 can keep the API shape while replacing the credential source with D1-backed admin users.

## Error Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요.",
    "details": {}
  }
}
```

## Local Commands

```bash
npm run worker:check
npm run worker:dev
npm run build
```

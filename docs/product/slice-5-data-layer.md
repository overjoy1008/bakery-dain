# Slice 5. Minimal Data Layer

## Scope

Slice 5 defines the first durable data model for D1.

- Users and guest users
- Categories and items
- Reservations and reservation items
- Bank transfer payments
- Coupons and reservation coupon snapshots
- Admin pickup rules and pickup exceptions
- Moving notice bar content
- Featured item placements
- Audit logs

## Source Files

```txt
docs/database/database-plan.md
worker/db/migrations/0001_initial_schema.sql
worker/db/seeds/0001_seed_mock_data.sql
worker/routes/auth.routes.ts
worker/routes/public.routes.ts
worker/routes/reservation.routes.ts
src/lib/api.ts
src/lib/bakery-data.ts
```

## Core Modeling Choices

- Guest reservations still create a `users` row with `user_type=guest`.
- Reservation status timeline is stored as explicit timestamp columns for fast admin scanning.
- Payment status is separated from reservation status because bank transfer confirmation may lag.
- Admin pickup availability uses a default rule plus date-level exceptions.
- Notice bar text and featured items are content tables, not hard-coded UI text.

## Next Steps

- Remote migration has been applied to `bakery-dain-db`.
- Remote seed data has been applied with `npm run db:seed:remote`.
- Worker has been deployed with `npm run worker:deploy`.
- Verified `/api/health`, `/api/public/menus`, `/api/public/pickup-rules`, and `/api/auth/username/check`.
- Verify signup/login/reservation writes through `/api/auth/*` and `/api/reservations`.

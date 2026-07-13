import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { parseJsonBody } from "../middleware/validate";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";

const adminLoginSchema = z.object({
  password: z.string().min(1),
  username: z.string().min(1),
});

const userPatchSchema = z.object({
  address: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  mileagePoints: z.number().int().min(0).optional(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
});

const reservationStatusSchema = z.object({
  adminNote: z.string().trim().optional(),
  status: z.enum([
    "payment_pending",
    "payment_confirmed",
    "making",
    "pickup_ready",
    "picked_up",
    "cancelled",
  ]),
});

const adminNoteSchema = z.object({
  adminNote: z.string().trim(),
});

const menuSchema = z.object({
  categoryId: z.string().trim().min(1),
  description: z.string().trim().min(1),
  imageKey: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  isReservable: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  maxPerPerson: z.number().int().positive(),
  minPrepDays: z.number().int().min(0),
  price: z.number().int().min(0),
  remainingLimitedQuantity: z.number().int().min(0).optional().nullable(),
  slug: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
  title: z.string().trim().min(1),
  totalLimitedQuantity: z.number().int().min(0).optional().nullable(),
});

const pickupRuleSchema = z.object({
  availableWeekdays: z.array(z.number().int().min(0).max(6)).min(1),
  dailyCapacity: z.number().int().positive().nullable().optional(),
  timeSlots: z.array(z.string().trim().min(1)).min(1),
});

const pickupExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exceptionType: z.enum(["unavailable", "custom_hours"]),
  reason: z.string().trim().optional().nullable(),
  timeSlots: z.array(z.string().trim().min(1)).optional().nullable(),
});

export const adminRoutes = new Hono<AppBindings>();

async function writeAuditLog(
  context: Context<AppBindings>,
  action: string,
  targetType: string,
  targetId: string,
  payload: unknown,
) {
  await context.env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, payload_json, created_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), action, targetType, targetId, JSON.stringify(payload), new Date().toISOString())
    .run();
}

adminRoutes.post("/auth/login", async (context) => {
  const credentials = await parseJsonBody(context.req.raw, adminLoginSchema);
  const expectedUsername = context.env.ADMIN_USERNAME;
  const expectedPassword = context.env.ADMIN_PASSWORD;
  const sessionToken = context.env.ADMIN_SESSION_TOKEN;

  if (!expectedUsername || !expectedPassword || !sessionToken) {
    throw new HttpError(500, "INTERNAL_ERROR", "관리자 로그인이 아직 설정되지 않았어요.");
  }

  const isValid =
    credentials.username === expectedUsername && credentials.password === expectedPassword;

  if (!isValid) {
    throw new HttpError(401, "UNAUTHORIZED", "아이디 또는 비밀번호를 확인해 주세요.");
  }

  return context.json({
    admin: {
      username: expectedUsername,
    },
    token: sessionToken,
  });
});

adminRoutes.post("/auth/logout", (context) =>
  context.json({
    ok: true,
  }),
);

adminRoutes.get("/me", requireAdmin, (context) =>
  context.json({
    admin: context.get("adminUser"),
  }),
);

adminRoutes.get("/dashboard", requireAdmin, async (context) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(new Date());

  const [todayReservations, weekReservations, pendingReservations, revenue, pickups, popularItems] =
    await Promise.all([
      context.env.DB.prepare(
        `SELECT COUNT(*) AS count
         FROM reservations
         WHERE pickup_date = ? AND status != 'cancelled'`,
      )
        .bind(today)
        .first<{ count: number }>(),
      context.env.DB.prepare(
        `SELECT COUNT(*) AS count
         FROM reservations
         WHERE pickup_date >= ? AND status != 'cancelled'`,
      )
        .bind(today)
        .first<{ count: number }>(),
      context.env.DB.prepare(
        `SELECT COUNT(*) AS count
         FROM reservations
         WHERE status = 'payment_pending'`,
      ).first<{ count: number }>(),
      context.env.DB.prepare(
        `SELECT COALESCE(SUM(total_payment_amount), 0) AS amount
         FROM reservations
         WHERE pickup_date >= ? AND status != 'cancelled'`,
      )
        .bind(today)
        .first<{ amount: number }>(),
      context.env.DB.prepare(
        `SELECT reservations.id, reservations.reservation_number, reservations.pickup_time,
                reservations.status, reservations.total_payment_amount,
                users.name, users.phone
         FROM reservations
         JOIN users ON users.id = reservations.user_id
         WHERE reservations.pickup_date = ?
         ORDER BY reservations.pickup_time ASC, reservations.created_at ASC
         LIMIT 8`,
      )
        .bind(today)
        .all(),
      context.env.DB.prepare(
        `SELECT reservation_items.item_title_snapshot AS title, SUM(reservation_items.quantity) AS quantity
         FROM reservation_items
         JOIN reservations ON reservations.id = reservation_items.reservation_id
         WHERE reservations.status != 'cancelled'
         GROUP BY reservation_items.item_title_snapshot
         ORDER BY quantity DESC
         LIMIT 5`,
      ).all(),
    ]);

  return context.json({
    dashboard: {
      pendingCount: pendingReservations?.count ?? 0,
      popularItems: popularItems.results,
      today,
      todayCount: todayReservations?.count ?? 0,
      todayPickups: pickups.results,
      weekCount: weekReservations?.count ?? 0,
      weekRevenue: revenue?.amount ?? 0,
    },
  });
});

adminRoutes.get("/users", requireAdmin, async (context) => {
  const query = context.req.query("q")?.trim() ?? "";
  const type = context.req.query("type")?.trim();
  const bindings: unknown[] = [];
  const where: string[] = [];

  if (query) {
    where.push(`(site_username LIKE ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)`);
    bindings.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (type && ["member", "guest", "admin"].includes(type)) {
    where.push(`user_type = ?`);
    bindings.push(type);
  }

  const users = await context.env.DB.prepare(
    `SELECT id, user_type, site_username, name, phone, email, address,
            is_phone_verified, is_email_verified, mileage_points, joined_at,
            last_login_at, created_at, updated_at
     FROM users
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC
     LIMIT 80`,
  )
    .bind(...bindings)
    .all();

  return context.json({
    users: users.results,
  });
});

adminRoutes.get("/users/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const user = await context.env.DB.prepare(
    `SELECT id, user_type, site_username, name, phone, email, address,
            is_phone_verified, is_email_verified, mileage_points, joined_at,
            last_login_at, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(id)
    .first();

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "회원을 찾을 수 없어요.");
  }

  const reservations = await context.env.DB.prepare(
    `SELECT id, reservation_number, pickup_date, pickup_time, status, total_payment_amount, created_at
     FROM reservations
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
  )
    .bind(id)
    .all();

  return context.json({
    reservations: reservations.results,
    user,
  });
});

adminRoutes.patch("/users/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const body = await parseJsonBody(context.req.raw, userPatchSchema);
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE users
     SET name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         mileage_points = COALESCE(?, mileage_points),
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.name ?? null,
      body.phone ?? null,
      body.email ?? null,
      body.address ?? null,
      body.mileagePoints ?? null,
      now,
      id,
    )
    .run();

  await writeAuditLog(context, "admin.users.update", "user", id, body);

  return context.json({
    ok: true,
  });
});

async function loadReservationItems(context: Context<AppBindings>, reservationId: string) {
  const items = await context.env.DB.prepare(
    `SELECT item_id, item_title_snapshot, item_image_key_snapshot, unit_price_snapshot, quantity, line_total
     FROM reservation_items
     WHERE reservation_id = ?
     ORDER BY created_at ASC`,
  )
    .bind(reservationId)
    .all();

  return items.results;
}

adminRoutes.get("/reservations", requireAdmin, async (context) => {
  const status = context.req.query("status")?.trim();
  const date = context.req.query("date")?.trim();
  const query = context.req.query("q")?.trim() ?? "";
  const bindings: unknown[] = [];
  const where: string[] = [];

  if (status) {
    where.push("reservations.status = ?");
    bindings.push(status);
  }

  if (date) {
    where.push("reservations.pickup_date = ?");
    bindings.push(date);
  }

  if (query) {
    where.push("(reservations.reservation_number LIKE ? OR users.name LIKE ? OR users.phone LIKE ?)");
    bindings.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  const reservations = await context.env.DB.prepare(
    `SELECT
       reservations.id,
       reservations.reservation_number,
       reservations.reservation_type,
       reservations.pickup_date,
       reservations.pickup_time,
       reservations.status,
       reservations.total_payment_amount,
       reservations.created_at,
       users.id AS user_id,
       users.name,
       users.phone,
       users.email,
       payments.status AS payment_status,
       payments.payer_name,
       payments.admin_note
     FROM reservations
     JOIN users ON users.id = reservations.user_id
     LEFT JOIN payments ON payments.reservation_id = reservations.id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY reservations.pickup_date DESC, reservations.created_at DESC
     LIMIT 120`,
  )
    .bind(...bindings)
    .all();

  const rows = await Promise.all(
    reservations.results.map(async (reservation) => ({
      ...reservation,
      items: await loadReservationItems(context, String(reservation.id)),
    })),
  );

  return context.json({
    reservations: rows,
  });
});

adminRoutes.get("/reservations/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const reservation = await context.env.DB.prepare(
    `SELECT
       reservations.*,
       users.name,
       users.phone,
       users.email,
       users.address,
       users.user_type,
       users.site_username,
       payments.id AS payment_id,
       payments.status AS payment_status,
       payments.payer_name,
       payments.payer_phone,
       payments.amount AS payment_amount,
       payments.admin_note
     FROM reservations
     JOIN users ON users.id = reservations.user_id
     LEFT JOIN payments ON payments.reservation_id = reservations.id
     WHERE reservations.id = ? OR reservations.reservation_number = ?
     LIMIT 1`,
  )
    .bind(id, id)
    .first();

  if (!reservation) {
    throw new HttpError(404, "NOT_FOUND", "예약을 찾을 수 없어요.");
  }

  return context.json({
    reservation: {
      ...reservation,
      items: await loadReservationItems(context, String(reservation.id)),
    },
  });
});

adminRoutes.patch("/reservations/:id/status", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const body = await parseJsonBody(context.req.raw, reservationStatusSchema);
  const now = new Date().toISOString();
  const statusColumnByStatus: Record<string, string | null> = {
    cancelled: "cancelled_at",
    making: "making_started_at",
    payment_confirmed: "payment_confirmed_at",
    payment_pending: "payment_pending_at",
    picked_up: "picked_up_at",
    pickup_ready: "pickup_ready_at",
  };
  const timestampColumn = statusColumnByStatus[body.status];
  const reservation = await context.env.DB.prepare(
    `SELECT id FROM reservations WHERE id = ? OR reservation_number = ? LIMIT 1`,
  )
    .bind(id, id)
    .first<{ id: string }>();

  if (!reservation) {
    throw new HttpError(404, "NOT_FOUND", "예약을 찾을 수 없어요.");
  }

  const updates = [
    context.env.DB.prepare(
      `UPDATE reservations
       SET status = ?,
           ${timestampColumn ? `${timestampColumn} = ?,` : ""}
           updated_at = ?
       WHERE id = ?`,
    ).bind(...(timestampColumn ? [body.status, now, now, reservation.id] : [body.status, now, reservation.id])),
  ];

  if (body.status === "payment_confirmed") {
    updates.push(
      context.env.DB.prepare(
        `UPDATE payments
         SET status = 'payment_confirmed', payment_confirmed_at = ?, admin_note = COALESCE(?, admin_note), updated_at = ?
         WHERE reservation_id = ?`,
      ).bind(now, body.adminNote ?? null, now, reservation.id),
    );
  } else if (body.status === "cancelled") {
    updates.push(
      context.env.DB.prepare(
        `UPDATE payments
         SET status = 'cancelled', cancelled_at = ?, admin_note = COALESCE(?, admin_note), updated_at = ?
         WHERE reservation_id = ?`,
      ).bind(now, body.adminNote ?? null, now, reservation.id),
    );
  } else if (body.adminNote) {
    updates.push(
      context.env.DB.prepare(
        `UPDATE payments SET admin_note = ?, updated_at = ? WHERE reservation_id = ?`,
      ).bind(body.adminNote, now, reservation.id),
    );
  }

  await context.env.DB.batch(updates);
  await writeAuditLog(context, "admin.reservations.status", "reservation", reservation.id, body);

  return context.json({
    ok: true,
  });
});

adminRoutes.patch("/reservations/:id/admin-note", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const body = await parseJsonBody(context.req.raw, adminNoteSchema);
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE payments
     SET admin_note = ?, updated_at = ?
     WHERE reservation_id = (SELECT id FROM reservations WHERE id = ? OR reservation_number = ? LIMIT 1)`,
  )
    .bind(body.adminNote, now, id, id)
    .run();

  return context.json({
    ok: true,
  });
});

adminRoutes.get("/menus", requireAdmin, async (context) => {
  const items = await context.env.DB.prepare(
    `SELECT
       items.*,
       categories.name AS category_name
     FROM items
     JOIN categories ON categories.id = items.category_id
     ORDER BY items.sort_order ASC, items.created_at DESC`,
  ).all();

  return context.json({
    items: items.results,
  });
});

adminRoutes.post("/menus", requireAdmin, async (context) => {
  const body = await parseJsonBody(context.req.raw, menuSchema);
  const now = new Date().toISOString();
  const id = `itm_${crypto.randomUUID()}`;

  await context.env.DB.prepare(
    `INSERT INTO items (
       id, category_id, title, slug, image_key, image_url, description, is_seasonal,
       price, min_prep_days, max_per_person, total_limited_quantity, remaining_limited_quantity,
       is_reservable, sort_order, registered_at, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.categoryId,
      body.title,
      body.slug,
      body.imageKey ?? null,
      body.imageUrl ?? null,
      body.description,
      body.isSeasonal ? 1 : 0,
      body.price,
      body.minPrepDays,
      body.maxPerPerson,
      body.totalLimitedQuantity ?? null,
      body.remainingLimitedQuantity ?? body.totalLimitedQuantity ?? null,
      body.isReservable === false ? 0 : 1,
      body.sortOrder ?? 100,
      now,
      now,
      now,
    )
    .run();

  await writeAuditLog(context, "admin.menus.create", "item", id, body);

  return context.json({ id }, 201);
});

adminRoutes.patch("/menus/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const body = await parseJsonBody(context.req.raw, menuSchema.partial());
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE items
     SET category_id = COALESCE(?, category_id),
         title = COALESCE(?, title),
         slug = COALESCE(?, slug),
         image_key = COALESCE(?, image_key),
         image_url = COALESCE(?, image_url),
         description = COALESCE(?, description),
         is_seasonal = COALESCE(?, is_seasonal),
         price = COALESCE(?, price),
         min_prep_days = COALESCE(?, min_prep_days),
         max_per_person = COALESCE(?, max_per_person),
         total_limited_quantity = ?,
         remaining_limited_quantity = ?,
         is_reservable = COALESCE(?, is_reservable),
         sort_order = COALESCE(?, sort_order),
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.categoryId ?? null,
      body.title ?? null,
      body.slug ?? null,
      body.imageKey ?? null,
      body.imageUrl ?? null,
      body.description ?? null,
      body.isSeasonal === undefined ? null : body.isSeasonal ? 1 : 0,
      body.price ?? null,
      body.minPrepDays ?? null,
      body.maxPerPerson ?? null,
      body.totalLimitedQuantity ?? null,
      body.remainingLimitedQuantity ?? body.totalLimitedQuantity ?? null,
      body.isReservable === undefined ? null : body.isReservable ? 1 : 0,
      body.sortOrder ?? null,
      now,
      id,
    )
    .run();

  await writeAuditLog(context, "admin.menus.update", "item", id, body);

  return context.json({ ok: true });
});

adminRoutes.delete("/menus/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const now = new Date().toISOString();
  const reservationItems = await context.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM reservation_items WHERE item_id = ?`,
  )
    .bind(id)
    .first<{ count: number }>();

  if ((reservationItems?.count ?? 0) > 0) {
    await context.env.DB.prepare(
      `UPDATE items SET is_reservable = 0, updated_at = ? WHERE id = ?`,
    )
      .bind(now, id)
      .run();
    await writeAuditLog(context, "admin.menus.hide", "item", id, {});
    return context.json({ mode: "hidden", ok: true });
  }

  await context.env.DB.prepare(`DELETE FROM items WHERE id = ?`).bind(id).run();
  await writeAuditLog(context, "admin.menus.delete", "item", id, {});

  return context.json({ mode: "deleted", ok: true });
});

adminRoutes.get("/pickup-rules", requireAdmin, async (context) => {
  const [rule, exceptions] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, available_weekdays_json, default_time_slots_json, daily_capacity, is_active, updated_at
       FROM pickup_rules
       WHERE id = 'default'
       LIMIT 1`,
    ).first(),
    context.env.DB.prepare(
      `SELECT id, date, exception_type, time_slots_json, reason, created_at, updated_at
       FROM pickup_exceptions
       ORDER BY date ASC`,
    ).all(),
  ]);

  return context.json({
    exceptions: exceptions.results,
    rule,
  });
});

adminRoutes.put("/pickup-rules", requireAdmin, async (context) => {
  const body = await parseJsonBody(context.req.raw, pickupRuleSchema);
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `INSERT INTO pickup_rules (
       id, available_weekdays_json, default_time_slots_json, daily_capacity, is_active, created_at, updated_at
     )
     VALUES ('default', ?, ?, ?, 1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       available_weekdays_json = excluded.available_weekdays_json,
       default_time_slots_json = excluded.default_time_slots_json,
       daily_capacity = excluded.daily_capacity,
       is_active = 1,
       updated_at = excluded.updated_at`,
  )
    .bind(
      JSON.stringify(body.availableWeekdays),
      JSON.stringify(body.timeSlots),
      body.dailyCapacity ?? null,
      now,
      now,
    )
    .run();

  await writeAuditLog(context, "admin.pickup_rules.update", "pickup_rule", "default", body);

  return context.json({ ok: true });
});

adminRoutes.post("/pickup-exceptions", requireAdmin, async (context) => {
  const body = await parseJsonBody(context.req.raw, pickupExceptionSchema);
  const now = new Date().toISOString();
  const id = `pex_${body.date.replaceAll("-", "")}_${crypto.randomUUID().slice(0, 8)}`;

  await context.env.DB.prepare(
    `INSERT INTO pickup_exceptions (
       id, date, exception_type, time_slots_json, reason, created_by_user_id, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
  )
    .bind(
      id,
      body.date,
      body.exceptionType,
      body.timeSlots ? JSON.stringify(body.timeSlots) : null,
      body.reason ?? null,
      now,
      now,
    )
    .run();

  await writeAuditLog(context, "admin.pickup_exceptions.create", "pickup_exception", id, body);

  return context.json({ id }, 201);
});

adminRoutes.patch("/pickup-exceptions/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  const body = await parseJsonBody(context.req.raw, pickupExceptionSchema.partial());
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE pickup_exceptions
     SET date = COALESCE(?, date),
         exception_type = COALESCE(?, exception_type),
         time_slots_json = COALESCE(?, time_slots_json),
         reason = COALESCE(?, reason),
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.date ?? null,
      body.exceptionType ?? null,
      body.timeSlots ? JSON.stringify(body.timeSlots) : null,
      body.reason ?? null,
      now,
      id,
    )
    .run();

  await writeAuditLog(context, "admin.pickup_exceptions.update", "pickup_exception", id, body);

  return context.json({ ok: true });
});

adminRoutes.delete("/pickup-exceptions/:id", requireAdmin, async (context) => {
  const id = context.req.param("id");
  await context.env.DB.prepare(`DELETE FROM pickup_exceptions WHERE id = ?`).bind(id).run();
  await writeAuditLog(context, "admin.pickup_exceptions.delete", "pickup_exception", id, {});

  return context.json({ ok: true });
});

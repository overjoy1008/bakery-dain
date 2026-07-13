import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { parseJsonBody } from "../middleware/validate";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";
import { getSessionUser, toPublicUser } from "../utils/session";

const updateMeSchema = z.object({
  address: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
});

type ReservationListRow = {
  created_at: string;
  id: string;
  payment_status: string | null;
  pickup_date: string;
  pickup_time: string;
  reservation_number: string;
  status: string;
  total_payment_amount: number;
};

type ReservationItemRow = {
  item_id: string;
  item_image_key_snapshot: string | null;
  item_title_snapshot: string;
  line_total: number;
  quantity: number;
  unit_price_snapshot: number;
};

type ReservationDetailRow = ReservationListRow & {
  request_note: string | null;
};

export const userRoutes = new Hono<AppBindings>();

async function requireSessionUser(context: Context<AppBindings>) {
  const user = await getSessionUser(context.req.raw, context.env);

  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "로그인이 필요해요.");
  }

  return user;
}

async function loadReservationItems(context: Context<AppBindings>, reservationId: string) {
  const items = await context.env.DB.prepare(
    `SELECT item_id, item_title_snapshot, item_image_key_snapshot, unit_price_snapshot, quantity, line_total
     FROM reservation_items
     WHERE reservation_id = ?
     ORDER BY created_at ASC`,
  )
    .bind(reservationId)
    .all<ReservationItemRow>();

  return items.results;
}

userRoutes.get("/me", async (context) => {
  const user = await requireSessionUser(context);
  const row = await context.env.DB.prepare(
    `SELECT id, user_type, site_username, name, phone, email, address,
            is_phone_verified, is_email_verified, mileage_points, joined_at, last_login_at, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(user.id)
    .first();

  return context.json({
    user: row ?? toPublicUser(user),
  });
});

userRoutes.patch("/me", async (context) => {
  const user = await requireSessionUser(context);
  const body = await parseJsonBody(context.req.raw, updateMeSchema);
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    `UPDATE users
     SET name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         updated_at = ?
     WHERE id = ? AND user_type = 'member'`,
  )
    .bind(body.name ?? null, body.phone ?? null, body.email ?? null, body.address ?? null, now, user.id)
    .run();

  const updatedUser = await context.env.DB.prepare(
    `SELECT id, user_type, site_username, name, phone, email, address,
            is_phone_verified, is_email_verified, mileage_points, joined_at, last_login_at, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(user.id)
    .first();

  return context.json({
    user: updatedUser,
  });
});

userRoutes.get("/me/reservations", async (context) => {
  const user = await requireSessionUser(context);
  const reservations = await context.env.DB.prepare(
    `SELECT
       reservations.id,
       reservations.reservation_number,
       reservations.pickup_date,
       reservations.pickup_time,
       reservations.status,
       reservations.total_payment_amount,
       reservations.created_at,
       payments.status AS payment_status
     FROM reservations
     LEFT JOIN payments ON payments.reservation_id = reservations.id
     WHERE reservations.user_id = ?
     ORDER BY reservations.pickup_date DESC, reservations.created_at DESC`,
  )
    .bind(user.id)
    .all<ReservationListRow>();

  const rows = await Promise.all(
    reservations.results.map(async (reservation) => ({
      ...reservation,
      items: await loadReservationItems(context, reservation.id),
    })),
  );

  return context.json({
    reservations: rows,
  });
});

userRoutes.get("/me/reservations/:id", async (context) => {
  const user = await requireSessionUser(context);
  const id = context.req.param("id");
  const reservation = await context.env.DB.prepare(
    `SELECT
       reservations.id,
       reservations.reservation_number,
       reservations.pickup_date,
       reservations.pickup_time,
       reservations.request_note,
       reservations.status,
       reservations.total_payment_amount,
       reservations.created_at,
       payments.status AS payment_status
     FROM reservations
     LEFT JOIN payments ON payments.reservation_id = reservations.id
     WHERE reservations.user_id = ?
       AND (reservations.id = ? OR reservations.reservation_number = ?)
     LIMIT 1`,
  )
    .bind(user.id, id, id)
    .first<ReservationDetailRow>();

  if (!reservation) {
    throw new HttpError(404, "NOT_FOUND", "예약을 찾을 수 없어요.");
  }

  return context.json({
    reservation: {
      ...reservation,
      items: await loadReservationItems(context, reservation.id),
    },
  });
});

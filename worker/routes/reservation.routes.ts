import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { parseJsonBody } from "../middleware/validate";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";
import { getSessionUser } from "../utils/session";

type ItemRow = {
  id: string;
  image_key: string | null;
  max_per_person: number;
  min_prep_days: number;
  price: number;
  remaining_limited_quantity: number | null;
  title: string;
};

type PickupRuleRow = {
  available_weekdays_json: string;
  daily_capacity: number | null;
  default_time_slots_json: string;
};

type PickupExceptionRow = {
  exception_type: "unavailable" | "custom_hours";
  time_slots_json: string | null;
};

const reservationSchema = z.object({
  customer: z.object({
    address: z.string().trim().min(1),
    email: z.string().trim().email(),
    name: z.string().trim().min(1),
    phone: z.string().trim().min(1),
  }),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupTime: z.string().min(1),
  requestNote: z.string().trim().optional(),
});

export const reservationRoutes = new Hono<AppBindings>();

function parseJsonList<TValue>(value: string | null | undefined, fallback: TValue[]) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as TValue[];
  } catch {
    return fallback;
  }
}

function getCurrentKstDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "07";
  const day = parts.find((part) => part.type === "day")?.value ?? "08";
  return `${year}-${month}-${day}`;
}

function getLeadDaysFromTomorrow(pickupDate: string) {
  const baseTime = new Date(`${getCurrentKstDateString()}T00:00:00`).getTime();
  const targetTime = new Date(`${pickupDate}T00:00:00`).getTime();
  return Math.round((targetTime - baseTime) / 86_400_000);
}

function toDateKey(date: string) {
  return date.replaceAll("-", "").slice(2);
}

function createReservationNumber(pickupDate: string) {
  const suffix = String(Date.now() % 10_000).padStart(4, "0");
  return `BD-${toDateKey(pickupDate)}-${suffix}`;
}

async function validatePickupSlot(
  context: Context<AppBindings>,
  pickupDate: string,
  pickupTime: string,
  requiredPrepDays: number,
) {
  const [rule, exception] = await Promise.all([
    context.env.DB.prepare(
      `SELECT available_weekdays_json, default_time_slots_json, daily_capacity
       FROM pickup_rules
       WHERE id = 'default' AND is_active = 1
       LIMIT 1`,
    ).first<PickupRuleRow>(),
    context.env.DB.prepare(
      `SELECT exception_type, time_slots_json
       FROM pickup_exceptions
       WHERE date = ?
       LIMIT 1`,
    )
      .bind(pickupDate)
      .first<PickupExceptionRow>(),
  ]);

  const leadDays = getLeadDaysFromTomorrow(pickupDate);

  if (leadDays < 1) {
    throw new HttpError(400, "DEADLINE_PASSED", "픽업일은 내일부터 선택할 수 있어요.");
  }

  if (leadDays < requiredPrepDays) {
    throw new HttpError(400, "DEADLINE_PASSED", "선택한 메뉴의 최소 준비 시간이 부족해요.");
  }

  const date = new Date(`${pickupDate}T00:00:00`);
  const availableWeekdays = parseJsonList<number>(rule?.available_weekdays_json, [1, 2, 3, 4, 5]);

  if (!availableWeekdays.includes(date.getDay()) || exception?.exception_type === "unavailable") {
    throw new HttpError(400, "DATE_CLOSED", "선택한 날짜는 픽업이 어려워요.");
  }

  const defaultTimeSlots = parseJsonList<string>(rule?.default_time_slots_json, [
    "14:00",
    "16:00",
    "18:00",
  ]);
  const timeSlots =
    exception?.exception_type === "custom_hours"
      ? parseJsonList<string>(exception.time_slots_json, defaultTimeSlots)
      : defaultTimeSlots;

  if (!timeSlots.includes(pickupTime)) {
    throw new HttpError(400, "DATE_CLOSED", "선택한 시간은 픽업이 어려워요.");
  }
}

reservationRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context.req.raw, reservationSchema);
  const sessionUser = await getSessionUser(context.req.raw, context.env);
  const now = new Date().toISOString();
  const requestedItems = new Map(body.items.map((item) => [item.itemId, item.quantity]));
  const itemIds = [...requestedItems.keys()];
  const placeholders = itemIds.map(() => "?").join(", ");
  const itemRows = await context.env.DB.prepare(
    `SELECT id, title, image_key, price, min_prep_days, max_per_person, remaining_limited_quantity
     FROM items
     WHERE id IN (${placeholders}) AND is_reservable = 1`,
  )
    .bind(...itemIds)
    .all<ItemRow>();

  if (itemRows.results.length !== itemIds.length) {
    throw new HttpError(400, "VALIDATION_ERROR", "예약 가능한 메뉴를 다시 확인해 주세요.");
  }

  let requiredPrepDays = 0;
  let totalAmount = 0;

  for (const item of itemRows.results) {
    const quantity = requestedItems.get(item.id) ?? 0;

    if (quantity > item.max_per_person) {
      throw new HttpError(400, "OUT_OF_STOCK", `${item.title}은 1인 최대 ${item.max_per_person}개까지 예약할 수 있어요.`);
    }

    if (item.remaining_limited_quantity !== null && quantity > item.remaining_limited_quantity) {
      throw new HttpError(400, "OUT_OF_STOCK", `${item.title}의 남은 수량이 부족해요.`);
    }

    requiredPrepDays = Math.max(requiredPrepDays, item.min_prep_days);
    totalAmount += item.price * quantity;
  }

  await validatePickupSlot(context, body.pickupDate, body.pickupTime, requiredPrepDays);

  const userId = sessionUser?.id ?? crypto.randomUUID();
  const reservationId = crypto.randomUUID();
  const paymentId = crypto.randomUUID();
  const reservationNumber = createReservationNumber(body.pickupDate);
  const reservationType = sessionUser ? "member" : "guest";

  const statements: D1PreparedStatement[] = [];

  if (!sessionUser) {
    statements.push(
      context.env.DB.prepare(
        `INSERT INTO users (
           id, user_type, site_username, password_hash, name, phone, email, address,
           is_phone_verified, is_email_verified, mileage_points, created_at, updated_at
         )
         VALUES (?, 'guest', NULL, NULL, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      ).bind(
        userId,
        body.customer.name,
        body.customer.phone,
        body.customer.email,
        body.customer.address,
        now,
        now,
      ),
    );
  }

  statements.push(
    context.env.DB.prepare(
      `INSERT INTO reservations (
         id, reservation_number, reservation_type, user_id, pickup_date, pickup_time,
         request_note, status, total_item_amount, discount_amount, total_payment_amount,
         payment_pending_at, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'payment_pending', ?, 0, ?, ?, ?, ?)`,
    ).bind(
      reservationId,
      reservationNumber,
      reservationType,
      userId,
      body.pickupDate,
      body.pickupTime,
      body.requestNote ?? "",
      totalAmount,
      totalAmount,
      now,
      now,
      now,
    ),
  );

  for (const item of itemRows.results) {
    const quantity = requestedItems.get(item.id) ?? 0;

    statements.push(
      context.env.DB.prepare(
        `INSERT INTO reservation_items (
           id, reservation_id, item_id, item_title_snapshot, item_image_key_snapshot,
           unit_price_snapshot, quantity, line_total, created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        reservationId,
        item.id,
        item.title,
        item.image_key,
        item.price,
        quantity,
        item.price * quantity,
        now,
      ),
    );

    if (item.remaining_limited_quantity !== null) {
      statements.push(
        context.env.DB.prepare(
          `UPDATE items
           SET remaining_limited_quantity = remaining_limited_quantity - ?, updated_at = ?
           WHERE id = ? AND remaining_limited_quantity IS NOT NULL`,
        ).bind(quantity, now, item.id),
      );
    }
  }

  statements.push(
    context.env.DB.prepare(
      `INSERT INTO payments (
         id, reservation_id, payment_method, payer_name, payer_phone, amount, status,
         payment_pending_at, created_at, updated_at
       )
       VALUES (?, ?, 'bank_transfer', ?, ?, ?, 'payment_pending', ?, ?, ?)`,
    ).bind(
      paymentId,
      reservationId,
      body.customer.name,
      body.customer.phone,
      totalAmount,
      now,
      now,
      now,
    ),
  );

  await context.env.DB.batch(statements);

  return context.json(
    {
      reservation: {
        id: reservationId,
        number: reservationNumber,
        paymentStatus: "payment_pending",
        status: "payment_pending",
        totalAmount,
      },
    },
    201,
  );
});

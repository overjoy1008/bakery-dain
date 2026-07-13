import { Hono } from "hono";
import { z } from "zod";
import { parseJsonBody } from "../middleware/validate";
import type { AppBindings } from "../types";
import { createSessionToken, hashPassword, verifyPassword } from "../utils/crypto";
import { HttpError } from "../utils/http-error";
import { getSessionSecret, getSessionUser, toPublicUser, type SessionUserRow } from "../utils/session";

const signupSchema = z.object({
  address: z.string().trim().min(1),
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  password: z.string().min(6),
  phone: z.string().trim().min(1),
  username: z.string().trim().min(3),
});

const loginSchema = z.object({
  password: z.string().min(1),
  username: z.string().trim().min(1),
});

export const authRoutes = new Hono<AppBindings>();

authRoutes.get("/username/check", async (context) => {
  const username = context.req.query("username")?.trim().toLowerCase();

  if (!username) {
    throw new HttpError(400, "VALIDATION_ERROR", "아이디를 입력해 주세요.");
  }

  const existingUser = await context.env.DB.prepare(
    `SELECT id
     FROM users
     WHERE lower(site_username) = ? AND user_type = 'member'
     LIMIT 1`,
  )
    .bind(username)
    .first<{ id: string }>();

  return context.json({
    available: !existingUser,
  });
});

authRoutes.post("/signup", async (context) => {
  const body = await parseJsonBody(context.req.raw, signupSchema);
  const username = body.username.toLowerCase();
  const existingUser = await context.env.DB.prepare(
    `SELECT id
     FROM users
     WHERE lower(site_username) = ? AND user_type = 'member'
     LIMIT 1`,
  )
    .bind(username)
    .first<{ id: string }>();

  if (existingUser) {
    throw new HttpError(409, "CONFLICT", "이미 사용 중인 아이디예요.");
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(body.password);

  await context.env.DB.prepare(
    `INSERT INTO users (
       id, user_type, site_username, password_hash, name, phone, email, address,
       is_phone_verified, is_email_verified, mileage_points, joined_at, created_at, updated_at
     )
     VALUES (?, 'member', ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`,
  )
    .bind(
      userId,
      username,
      passwordHash,
      body.name,
      body.phone,
      body.email,
      body.address,
      now,
      now,
      now,
    )
    .run();

  const user: SessionUserRow = {
    address: body.address,
    email: body.email,
    id: userId,
    name: body.name,
    phone: body.phone,
    site_username: username,
    user_type: "member",
  };
  const token = await createSessionToken(userId, getSessionSecret(context.env));

  return context.json(
    {
      redirectTo: "/mypage",
      token,
      user: toPublicUser(user),
    },
    201,
  );
});

authRoutes.post("/login", async (context) => {
  const body = await parseJsonBody(context.req.raw, loginSchema);
  const username = body.username.toLowerCase();
  const user = await context.env.DB.prepare(
    `SELECT id, user_type, site_username, password_hash, name, phone, email, address
     FROM users
     WHERE lower(site_username) = ? AND user_type IN ('member', 'admin')
     LIMIT 1`,
  )
    .bind(username)
    .first<SessionUserRow & { password_hash: string | null }>();

  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    const expectedUsername = context.env.ADMIN_USERNAME?.toLowerCase();
    const expectedPassword = context.env.ADMIN_PASSWORD;
    const sessionToken = context.env.ADMIN_SESSION_TOKEN;
    const isAdmin =
      Boolean(expectedUsername && expectedPassword && sessionToken) &&
      username === expectedUsername &&
      body.password === expectedPassword;

    if (!isAdmin || !sessionToken || !context.env.ADMIN_USERNAME) {
      throw new HttpError(401, "UNAUTHORIZED", "아이디 또는 비밀번호를 확인해 주세요.");
    }

    return context.json({
      redirectTo: "/admin",
      token: sessionToken,
      user: {
        address: "",
        email: "",
        id: "usr_admin_owner",
        name: "다닷네 관리자",
        phone: "",
        userType: "admin",
        username: context.env.ADMIN_USERNAME,
      },
    });
  }

  await context.env.DB.prepare(
    `UPDATE users
     SET last_login_at = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(new Date().toISOString(), new Date().toISOString(), user.id)
    .run();

  if (user.user_type === "admin") {
    const sessionToken = context.env.ADMIN_SESSION_TOKEN;

    if (!sessionToken) {
      throw new HttpError(500, "INTERNAL_ERROR", "관리자 세션이 아직 설정되지 않았어요.");
    }

    return context.json({
      redirectTo: "/admin",
      token: sessionToken,
      user: {
        ...toPublicUser(user),
        userType: "admin",
      },
    });
  }

  const token = await createSessionToken(user.id, getSessionSecret(context.env));

  return context.json({
    redirectTo: "/mypage",
    token,
    user: toPublicUser(user),
  });
});

authRoutes.get("/me", async (context) => {
  const user = await getSessionUser(context.req.raw, context.env);

  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "로그인이 필요해요.");
  }

  return context.json({
    user: toPublicUser(user),
  });
});

authRoutes.post("/logout", (context) =>
  context.json({
    ok: true,
  }),
);

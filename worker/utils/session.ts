import type { WorkerEnv } from "../types";
import { HttpError } from "./http-error";
import { verifySessionToken } from "./crypto";

export type SessionUserRow = {
  address: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  site_username: string;
};

export function getSessionSecret(env: WorkerEnv) {
  const secret = env.USER_SESSION_SECRET ?? env.ADMIN_SESSION_TOKEN;

  if (!secret) {
    throw new HttpError(500, "INTERNAL_ERROR", "사용자 세션 비밀키가 설정되지 않았어요.");
  }

  return secret;
}

export function toPublicUser(user: SessionUserRow) {
  return {
    address: user.address,
    email: user.email,
    id: user.id,
    name: user.name,
    phone: user.phone,
    username: user.site_username,
  };
}

export async function getSessionUser(request: Request, env: WorkerEnv) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return null;
  }

  const verified = await verifySessionToken(token, getSessionSecret(env));

  if (!verified) {
    return null;
  }

  return env.DB.prepare(
    `SELECT id, site_username, name, phone, email, address
     FROM users
     WHERE id = ? AND user_type = 'member'
     LIMIT 1`,
  )
    .bind(verified.userId)
    .first<SessionUserRow>();
}


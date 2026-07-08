import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";

export const requireAdmin: MiddlewareHandler<AppBindings> = async (context, next) => {
  const authorization = context.req.header("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  const expectedToken = context.env.ADMIN_SESSION_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    throw new HttpError(401, "UNAUTHORIZED", "관리자 로그인이 필요합니다.");
  }

  context.set("adminUser", {
    username: context.env.ADMIN_USERNAME ?? "admin",
  });

  await next();
};

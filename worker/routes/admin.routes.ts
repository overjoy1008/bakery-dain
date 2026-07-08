import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import { parseJsonBody } from "../middleware/validate";
import type { AppBindings } from "../types";
import { HttpError } from "../utils/http-error";

const adminLoginSchema = z.object({
  password: z.string().min(1),
  username: z.string().min(1),
});

export const adminRoutes = new Hono<AppBindings>();

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

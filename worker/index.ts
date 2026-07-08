import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { healthRoutes } from "./routes/health.routes";
import { publicRoutes } from "./routes/public.routes";
import { reservationRoutes } from "./routes/reservation.routes";
import type { AppBindings } from "./types";
import { HttpError, toErrorResponse } from "./utils/http-error";

const app = new Hono<AppBindings>().basePath("/api");

app.use(
  "*",
  cors({
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    origin: (origin) => origin,
  }),
);

app.route("/", healthRoutes);
app.route("/admin", adminRoutes);
app.route("/auth", authRoutes);
app.route("/public", publicRoutes);
app.route("/reservations", reservationRoutes);

app.notFound(() => {
  throw new HttpError(404, "NOT_FOUND", "요청한 API를 찾을 수 없어요.");
});

app.onError((error, context) => {
  const response = toErrorResponse(error);
  return context.json(response.body, response.status as ContentfulStatusCode);
});

export default app;

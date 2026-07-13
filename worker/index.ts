import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { healthRoutes } from "./routes/health.routes";
import { adminMediaRoutes, mediaRoutes } from "./routes/media.routes";
import { publicRoutes } from "./routes/public.routes";
import { reservationRoutes } from "./routes/reservation.routes";
import type { AppBindings } from "./types";
import { HttpError, toErrorResponse } from "./utils/http-error";
import { syncR2UsageFromCloudflare } from "./services/r2-analytics";

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
app.route("/admin/media", adminMediaRoutes);
app.route("/auth", authRoutes);
app.route("/media", mediaRoutes);
app.route("/public", publicRoutes);
app.route("/reservations", reservationRoutes);

app.notFound(() => {
  throw new HttpError(404, "NOT_FOUND", "요청한 API를 찾을 수 없어요.");
});

app.onError((error, context) => {
  const response = toErrorResponse(error);
  return context.json(response.body, response.status as ContentfulStatusCode);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: AppBindings["Bindings"], context: ExecutionContext) {
    context.waitUntil(syncR2UsageFromCloudflare(env));
  },
};

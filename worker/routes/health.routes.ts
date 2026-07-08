import { Hono } from "hono";
import type { AppBindings } from "../types";

export const healthRoutes = new Hono<AppBindings>();

healthRoutes.get("/health", (context) =>
  context.json({
    ok: true,
    service: "bakery-dain-api",
    environment: context.env.ENVIRONMENT,
    time: new Date().toISOString(),
  }),
);

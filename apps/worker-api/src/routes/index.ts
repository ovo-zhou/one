import { Hono } from "hono";
import { pingRoutes } from "./ping";
import { authRoutes } from "./auth";
import { merchantRoutes, publicRoutes } from "./merchant";
import type { AppEnv } from "../core/context";
import { adminRoutes } from "./admin";
import { customerRoutes } from "./bookings";

export const routes = new Hono<AppEnv>()
  .route("/", pingRoutes)
  .route("/api/v1/auth", authRoutes)
  .route("/api/v1/merchant", merchantRoutes)
  .route("/api/v1/customer", customerRoutes)
  .route("/api/v1/admin", adminRoutes)
  .route("/api/v1/public", publicRoutes);

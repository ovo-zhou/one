import { Hono } from "hono";
import { pingRoutes } from "./ping";

export const routes = new Hono<{ Bindings: Env }>().route("/", pingRoutes);

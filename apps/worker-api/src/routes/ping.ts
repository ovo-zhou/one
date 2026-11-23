import { Hono } from "hono";

export const pingRoutes = new Hono<{ Bindings: Env }>().get("/ping", (c) =>
  c.json({ message: "pong" }),
);

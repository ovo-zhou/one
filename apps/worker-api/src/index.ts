import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ message: "Hello World!" }));

app.get("/health", (c) => c.json({ ok: true }));

app.get("/db-check", async (c) => {
  const result = await c.env.DB.prepare("SELECT 1 AS connected").first<{ connected: number }>();
  const ok = result?.connected === 1;

  return c.json({ ok }, ok ? 200 : 503);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;

import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json({ message: "Hello World!" }));

app.get("/health", (c) => c.json({ ok: true }));

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;

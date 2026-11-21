import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/ping", (c) => c.json({ message: "pong" }));

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;

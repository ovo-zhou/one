import { Hono } from "hono";
import { routes } from "./routes";

const app = new Hono<{ Bindings: Env }>();

app.route("/", routes);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;

import { Hono } from "hono";
import { routes } from "./routes";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./core/context";

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  bodyLimit({ maxSize: 128 * 1024, onError: (c) => c.json({ error: "请求内容过大" }, 413) }),
);
app.onError((error, c) => {
  c.header("Cache-Control", "no-store");
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  // Do not log database query parameters: they may contain phone numbers or OpenIDs.
  console.error("Unhandled API error", { method: c.req.method, path: c.req.path });
  return c.json({ error: "服务暂不可用，请稍后重试" }, 500);
});

app.route("/", routes);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;

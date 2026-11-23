import { and, eq, gt } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../core/context";
import { sha256 } from "../core/crypto";
import { createDb } from "../db";
import { sessions, users } from "../db/schema";

export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new HTTPException(401, { message: "请先登录" });
  const [session] = await createDb(c.env.DB)
    .select({ userId: users.id, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, await sha256(token)),
        gt(sessions.expiresAt, Date.now()),
        eq(users.status, "active"),
      ),
    )
    .limit(1);
  if (!session) throw new HTTPException(401, { message: "登录已过期，请再次点击按钮重新登录" });
  c.set("userId", session.userId);
  c.set("role", session.role);
  c.header("Cache-Control", "no-store");
  await next();
});

export const requireMerchant = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get("role") !== "merchant") throw new HTTPException(403, { message: "仅商家可访问" });
  await next();
});

export const requireSuperAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get("role") !== "super_admin")
    throw new HTTPException(403, { message: "仅超级管理员可访问" });
  await next();
});

import { and, eq, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppEnv } from "../core/context";
import { createToken, sha256 } from "../core/crypto";
import { createDb } from "../db";
import { authRateLimits, sessions, users } from "../db/schema";
import { verifyWechatLogin } from "../services/wechat";
import { authenticate } from "../middleware/authenticate";

const credentials = z.object({
  loginCode: z.string().min(1).max(256),
  existingOnly: z.boolean().optional().default(false),
});

export const authRoutes = new Hono<AppEnv>()
  .get("/me", authenticate, (c) => c.json({ user: { id: c.get("userId"), role: c.get("role") } }))
  .post("/wechat", async (c) => {
    c.header("Cache-Control", "no-store");
    const parsed = credentials.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new HTTPException(400, { message: "请提供有效的微信登录凭证" });
    const db = createDb(c.env.DB);
    const now = Date.now();
    const bucket = Math.floor(now / 300_000);
    const key = await sha256(`${c.req.header("CF-Connecting-IP") ?? "local"}:${bucket}`);
    const [, limits] = await db.batch([
      db.delete(authRateLimits).where(lte(authRateLimits.expiresAt, now)),
      db
        .insert(authRateLimits)
        .values({ key, attempts: 1, expiresAt: (bucket + 1) * 300_000 })
        .onConflictDoUpdate({
          target: authRateLimits.key,
          set: { attempts: sql`${authRateLimits.attempts} + 1` },
        })
        .returning({ attempts: authRateLimits.attempts }),
    ]);
    if (!limits[0] || limits[0].attempts > 30) {
      c.header("Retry-After", String(Math.ceil(((bucket + 1) * 300_000 - now) / 1000)));
      throw new HTTPException(429, { message: "登录请求过于频繁，请稍后再试" });
    }
    const identity = await verifyWechatLogin(c.env, parsed.data.loginCode);
    // Explicit entry actions may restore an existing account without registering visitors.
    const [user] = parsed.data.existingOnly
      ? await db
          .select({ id: users.id, status: users.status, role: users.role })
          .from(users)
          .where(and(eq(users.appId, identity.appId), eq(users.openid, identity.openid)))
          .limit(1)
      : await db
          .insert(users)
          .values({ id: crypto.randomUUID(), ...identity, createdAt: now, updatedAt: now })
          .onConflictDoUpdate({
            target: [users.appId, users.openid],
            set: { updatedAt: now },
          })
          .returning({ id: users.id, status: users.status, role: users.role });
    if (!user && parsed.data.existingOnly) return c.json({ session: null });
    if (!user || user.status !== "active")
      throw new HTTPException(403, { message: "账号不可用，请联系管理员" });
    const token = createToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
    await db.batch([
      db.delete(sessions).where(lte(sessions.expiresAt, now)),
      db
        .insert(sessions)
        .values({ tokenHash: await sha256(token), userId: user.id, createdAt: now, expiresAt }),
    ]);
    return c.json({ token, expiresAt, user: { id: user.id, role: user.role } });
  });

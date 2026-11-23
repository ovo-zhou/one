import { and, asc, desc, eq, lt, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppEnv } from "../core/context";
import { pagination, pageResult } from "../core/pagination";
import { createDb } from "../db";
import { adminAuditLogs, shops, staff, users } from "../db/schema";
import { authenticate, requireSuperAdmin } from "../middleware/authenticate";

const filters = z.object({
  q: z.string().trim().max(80).default(""),
  status: z.enum(["active", "disabled"]).optional(),
});
const statusChange = z.object({
  status: z.enum(["active", "disabled"]),
  reason: z.string().trim().min(1).max(300),
  version: z.number().int().nonnegative(),
});

export const adminRoutes = new Hono<AppEnv>()
  .use("*", authenticate, requireSuperAdmin)
  .get("/shops", async (c) => {
    const query = c.req.query();
    const parsed = filters.safeParse(query);
    if (!parsed.success) throw new HTTPException(400, { message: "搜索条件无效" });
    const { limit, before, afterId } = pagination(query);
    const { q, status } = parsed.data;
    const rows = await createDb(c.env.DB)
      .select({
        id: shops.id,
        name: shops.name,
        address: shops.address,
        status: shops.status,
        updatedAt: shops.updatedAt,
        ownerStatus: users.status,
        staffCount: sql<number>`(select count(*) from staff where staff.shop_id = ${shops.id})`,
      })
      .from(shops)
      .innerJoin(users, eq(shops.ownerId, users.id))
      .where(
        and(
          q ? sql`instr(lower(${shops.name}), lower(${q})) > 0` : undefined,
          status ? eq(shops.status, status) : undefined,
          before !== undefined
            ? or(
                lt(shops.updatedAt, before),
                and(eq(shops.updatedAt, before), lt(shops.id, afterId!)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(shops.updatedAt), desc(shops.id))
      .limit(limit + 1);
    return c.json(pageResult(rows, limit, (row) => row.updatedAt));
  })
  .get("/shops/:id", async (c) => {
    const db = createDb(c.env.DB);
    const [shop] = await db
      .select({
        id: shops.id,
        ownerId: shops.ownerId,
        name: shops.name,
        description: shops.description,
        address: shops.address,
        phone: shops.phone,
        businessHours: shops.businessHours,
        status: shops.status,
        statusReason: shops.statusReason,
        moderationVersion: shops.moderationVersion,
        updatedAt: shops.updatedAt,
        ownerStatus: users.status,
      })
      .from(shops)
      .innerJoin(users, eq(shops.ownerId, users.id))
      .where(eq(shops.id, c.req.param("id")))
      .limit(1);
    if (!shop) throw new HTTPException(404, { message: "店铺不存在" });
    const people = await db
      .select({
        publicId: staff.id,
        name: staff.name,
        title: staff.title,
        skills: staff.skills,
        description: staff.description,
      })
      .from(staff)
      .where(eq(staff.shopId, shop.id))
      .orderBy(asc(staff.sortOrder), asc(staff.id));
    return c.json({ shop, staff: people });
  })
  .put("/shops/:id/status", async (c) => {
    const parsed = statusChange.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new HTTPException(400, { message: "请选择状态并填写操作原因" });
    const db = createDb(c.env.DB);
    const id = c.req.param("id");
    const [shop] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    if (!shop) throw new HTTPException(404, { message: "店铺不存在" });
    if (shop.moderationVersion !== parsed.data.version || shop.status === parsed.data.status)
      throw new HTTPException(409, { message: "店铺状态已变化，请刷新后重试" });
    const now = Date.now();
    const logId = crypto.randomUUID();
    const change = parsed.data;
    // INSERT first, then update only if this transaction inserted its own log.
    // D1's atomic batch and optimistic version protect concurrent moderation.
    const [logs] = await db.batch([
      db
        .insert(adminAuditLogs)
        .select(
          db
            .select({
              id: sql<string>`${logId}`.as("id"),
              actorId: sql<string>`${c.get("userId")}`.as("actor_id"),
              shopId: shops.id,
              action:
                sql<string>`${change.status === "disabled" ? "disable_shop" : "restore_shop"}`.as(
                  "action",
                ),
              reason: sql<string>`${change.reason}`.as("reason"),
              previousStatus: shops.status,
              nextStatus: sql<string>`${change.status}`.as("next_status"),
              createdAt: sql<number>`${now}`.as("created_at"),
            })
            .from(shops)
            .where(
              and(
                eq(shops.id, id),
                eq(shops.moderationVersion, change.version),
                eq(shops.status, shop.status),
              ),
            ),
        )
        .returning({ id: adminAuditLogs.id }),
      db
        .update(shops)
        .set({
          status: change.status,
          statusReason: change.reason,
          moderationVersion: change.version + 1,
          updatedAt: now,
        })
        .where(
          and(
            eq(shops.id, id),
            eq(shops.moderationVersion, change.version),
            sql`exists (select 1 from admin_audit_logs where id = ${logId})`,
          ),
        ),
    ]);
    if (!logs.length) throw new HTTPException(409, { message: "店铺状态已变化，请刷新后重试" });
    return c.json({ updatedAt: now });
  })
  .get("/shops/:id/audit", async (c) => {
    const { limit, before, afterId } = pagination(c.req.query());
    const rows = await createDb(c.env.DB)
      .select()
      .from(adminAuditLogs)
      .where(
        and(
          eq(adminAuditLogs.shopId, c.req.param("id")),
          before !== undefined
            ? or(
                lt(adminAuditLogs.createdAt, before),
                and(eq(adminAuditLogs.createdAt, before), lt(adminAuditLogs.id, afterId!)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
      .limit(limit + 1);
    return c.json(pageResult(rows, limit, (row) => row.createdAt));
  });

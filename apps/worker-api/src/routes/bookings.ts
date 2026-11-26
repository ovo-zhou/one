import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppEnv } from "../core/context";
import { sha256 } from "../core/crypto";
import { pagination, pageResult } from "../core/pagination";
import { createDb } from "../db";
import { bookings, shops, staff } from "../db/schema";
import { authenticate, requireMerchant } from "../middleware/authenticate";

const bookingInput = z.object({
  staffId: z.string().regex(/^[a-f0-9]{64}$/),
  contactName: z.string().trim().min(1).max(40),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,25}$/),
  requestedAt: z.number().int().positive(),
  note: z.string().trim().max(500).default(""),
  requestKey: z.string().uuid(),
  consent: z.literal(true),
});

const customerFields = {
  id: bookings.id,
  shopName: bookings.shopName,
  shopAddress: bookings.shopAddress,
  shopPhone: bookings.shopPhone,
  shopWechat: bookings.shopWechat,
  shopQq: bookings.shopQq,
  staffName: bookings.staffName,
  staffTitle: bookings.staffTitle,
  contactName: bookings.contactName,
  contactPhone: bookings.contactPhone,
  requestedAt: bookings.requestedAt,
  note: bookings.note,
  status: bookings.status,
  createdAt: bookings.createdAt,
  updatedAt: bookings.updatedAt,
};

export const customerRoutes = new Hono<AppEnv>()
  .use("*", authenticate)
  .post("/bookings", async (c) => {
    const parsed = bookingInput.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      throw new HTTPException(400, { message: "请检查预约人员、联系方式和意向时间" });
    const { requestKey, ...payload } = parsed.data;
    const db = createDb(c.env.DB);
    const customerId = c.get("userId");
    const payloadHash = await sha256(JSON.stringify(payload));
    const replay = async () => {
      const [existing] = await db
        .select({ id: bookings.id, payloadHash: bookings.payloadHash })
        .from(bookings)
        .where(and(eq(bookings.customerId, customerId), eq(bookings.requestKey, requestKey)))
        .limit(1);
      if (existing && existing.payloadHash !== payloadHash)
        throw new HTTPException(409, { message: "这次提交的内容已变化，请重新发起预约" });
      return existing;
    };
    const existing = await replay();
    if (existing) return c.json({ id: existing.id });
    // Ownership, not the cached/login role, decides whether this is a self-booking.
    // Keep historical idempotent replays above: they do not create a new booking.
    const [ownStaff] = await db
      .select({ id: staff.id })
      .from(staff)
      .innerJoin(shops, eq(staff.shopId, shops.id))
      .where(and(eq(staff.id, payload.staffId), eq(shops.ownerId, customerId)))
      .limit(1);
    if (ownStaff) throw new HTTPException(403, { message: "不能预约自己店铺的服务人员" });
    const now = Date.now();
    if (payload.requestedAt <= now || payload.requestedAt > now + 90 * 86_400_000)
      throw new HTTPException(400, { message: "请选择未来 90 天内的意向时间" });
    const id = crypto.randomUUID();
    // One guarded INSERT prevents disabled/deleted records from being booked
    // between a read and write. Snapshot fields survive personnel deletion.
    const inserted = await db.all<{ id: string }>(sql`
      insert into bookings (id, customer_id, shop_id, staff_public_id, shop_name, shop_address,
        shop_phone, shop_wechat, shop_qq, staff_name, staff_title, contact_name, contact_phone, requested_at, note,
        status, request_key, payload_hash, created_at, updated_at)
      select ${id}, ${customerId}, s.id, p.id, s.name, trim(s.address || ' ' || s.address_detail), s.phone, s.wechat, s.qq, p.name, p.title,
        ${payload.contactName}, ${payload.contactPhone}, ${payload.requestedAt}, ${payload.note},
        'pending', ${requestKey}, ${payloadHash}, ${now}, ${now}
      from staff p join shops s on p.shop_id = s.id join users u on s.owner_id = u.id
      where p.id = ${payload.staffId} and s.status = 'active' and u.status = 'active'
        and s.owner_id <> ${customerId}
        and (select count(*) from bookings where customer_id = ${customerId} and created_at > ${now - 3_600_000}) < 10
      on conflict(customer_id, request_key) do nothing returning id`);
    if (inserted.length) return c.json({ id }, 201);
    const duplicate = await replay();
    if (duplicate) return c.json({ id: duplicate.id });
    throw new HTTPException(409, {
      message: "人员或店铺暂不可预约，或预约提交过于频繁，请稍后重试",
    });
  })
  .get("/bookings", async (c) => {
    const { limit, before, afterId } = pagination(c.req.query());
    const rows = await createDb(c.env.DB)
      .select(customerFields)
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, c.get("userId")),
          before !== undefined
            ? or(
                lt(bookings.createdAt, before),
                and(eq(bookings.createdAt, before), lt(bookings.id, afterId!)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(bookings.createdAt), desc(bookings.id))
      .limit(limit + 1);
    return c.json(pageResult(rows, limit, (row) => row.createdAt));
  })
  .get("/bookings/:id", async (c) => {
    const [booking] = await createDb(c.env.DB)
      .select(customerFields)
      .from(bookings)
      .where(and(eq(bookings.id, c.req.param("id")), eq(bookings.customerId, c.get("userId"))))
      .limit(1);
    if (!booking) throw new HTTPException(404, { message: "预约不存在" });
    return c.json({ booking });
  })
  .put("/bookings/:id/cancel", async (c) => {
    const rows = await createDb(c.env.DB)
      .update(bookings)
      .set({ status: "cancelled", updatedAt: Date.now() })
      .where(
        and(
          eq(bookings.id, c.req.param("id")),
          eq(bookings.customerId, c.get("userId")),
          or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
        ),
      )
      .returning({ id: bookings.id });
    if (!rows.length)
      throw new HTTPException(409, { message: "预约不存在或当前状态不可取消，请刷新" });
    return c.json({ id: rows[0]!.id });
  });

export const merchantBookingRoutes = new Hono<AppEnv>()
  // Mounted inside merchantRoutes, after its shared authentication middleware.
  .use("*", requireMerchant)
  .get("/bookings", async (c) => {
    const { limit, before, afterId } = pagination(c.req.query());
    const rows = await createDb(c.env.DB)
      .select(customerFields)
      .from(bookings)
      .innerJoin(shops, eq(bookings.shopId, shops.id))
      .where(
        and(
          eq(shops.ownerId, c.get("userId")),
          before !== undefined
            ? or(
                lt(bookings.createdAt, before),
                and(eq(bookings.createdAt, before), lt(bookings.id, afterId!)),
              )
            : undefined,
        ),
      )
      .orderBy(desc(bookings.createdAt), desc(bookings.id))
      .limit(limit + 1);
    return c.json(pageResult(rows, limit, (row) => row.createdAt));
  })
  .put("/bookings/:id/status", async (c) => {
    const parsed = z
      .object({ status: z.enum(["confirmed", "rejected", "completed"]) })
      .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new HTTPException(400, { message: "预约状态无效" });
    const status = parsed.data.status;
    const rows = await createDb(c.env.DB)
      .update(bookings)
      .set({ status, updatedAt: Date.now() })
      .where(
        and(
          eq(bookings.id, c.req.param("id")),
          eq(bookings.status, status === "completed" ? "confirmed" : "pending"),
          // A stopped shop can reject/finish existing work, but cannot confirm new work.
          sql`exists (select 1 from shops where shops.id = ${bookings.shopId} and owner_id = ${c.get("userId")}
        ${status === "confirmed" ? sql`and shops.status = 'active'` : sql``})`,
        ),
      )
      .returning({ id: bookings.id });
    if (!rows.length)
      throw new HTTPException(409, { message: "预约状态已变化、店铺已停用或无权操作，请刷新" });
    return c.json({ id: rows[0]!.id });
  });

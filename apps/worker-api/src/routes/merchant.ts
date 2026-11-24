import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppEnv } from "../core/context";
import { sha256 } from "../core/crypto";
import { createDb } from "../db";
import { shops, staff, users } from "../db/schema";
import { authenticate, requireMerchant } from "../middleware/authenticate";
import { merchantBookingRoutes } from "./bookings";

const shopSchema = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().trim().max(500),
  address: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,25}$/),
  businessHours: z.string().trim().max(80),
});
const staffSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1).max(40),
  skills: z.string().trim().min(1).max(150),
  description: z.string().trim().max(600),
});
const profileSchema = z
  .object({ shop: shopSchema, staff: z.array(staffSchema).min(1).max(50) })
  .refine((value) => new Set(value.staff.map((person) => person.id)).size === value.staff.length);

const shopFields = {
  name: shops.name,
  description: shops.description,
  address: shops.address,
  phone: shops.phone,
  businessHours: shops.businessHours,
};
const staffFields = {
  id: staff.clientId,
  publicId: staff.id,
  name: staff.name,
  title: staff.title,
  skills: staff.skills,
  description: staff.description,
};

export const merchantRoutes = new Hono<AppEnv>()
  .use("*", authenticate)
  .get("/profile", requireMerchant, async (c) => {
    const db = createDb(c.env.DB);
    const [shop] = await db
      .select({
        ...shopFields,
        id: shops.id,
        updatedAt: shops.updatedAt,
        status: shops.status,
        statusReason: shops.statusReason,
      })
      .from(shops)
      .where(eq(shops.ownerId, c.get("userId")))
      .limit(1);
    if (!shop && c.get("role") === "super_admin")
      throw new HTTPException(409, { message: "当前管理员账号未关联店铺，请联系管理员核查" });
    if (!shop) return c.json({ profile: null });
    const people = await db
      .select(staffFields)
      .from(staff)
      .where(eq(staff.shopId, shop.id))
      .orderBy(asc(staff.sortOrder));
    return c.json({
      profile: {
        shop: {
          name: shop.name,
          description: shop.description,
          address: shop.address,
          phone: shop.phone,
          businessHours: shop.businessHours,
        },
        staff: people,
        updatedAt: shop.updatedAt,
        status: shop.status,
        statusReason: shop.statusReason,
      },
    });
  })
  .put("/shop", requireMerchant, async (c) => {
    const parsed = shopSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new HTTPException(400, { message: "请检查店铺必填信息及字段长度" });
    const updatedAt = Date.now();
    // Shop editing must not publish or replace unrelated local staff drafts.
    const [shop] = await createDb(c.env.DB)
      .update(shops)
      .set({ ...parsed.data, updatedAt })
      .where(eq(shops.ownerId, c.get("userId")))
      .returning({ id: shops.id });
    if (!shop) throw new HTTPException(404, { message: "店铺不存在，请联系管理员核查" });
    return c.json({ updatedAt });
  })
  .put("/staff", requireMerchant, async (c) => {
    const parsed = staffSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new HTTPException(400, { message: "请检查人员必填信息及字段长度" });
    const db = createDb(c.env.DB);
    const ownerId = c.get("userId");
    const [shop] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.ownerId, ownerId))
      .limit(1);
    if (!shop) throw new HTTPException(404, { message: "店铺不存在，请联系管理员核查" });
    const { id: clientId, ...person } = parsed.data;
    const id = await sha256(`${ownerId}:${clientId}`);
    const updatedAt = Date.now();
    // A single INSERT ... SELECT enforces the limit atomically, including concurrent adds.
    // Updating one person must not publish local edits to the shop or other people.
    const [saved] = await db.batch([
      db
        .insert(staff)
        .select(
          db
            .select({
              id: sql<string>`${id}`.as("id"),
              shopId: shops.id,
              clientId: sql<string>`${clientId}`.as("client_id"),
              name: sql<string>`${person.name}`.as("name"),
              title: sql<string>`${person.title}`.as("title"),
              skills: sql<string>`${person.skills}`.as("skills"),
              description: sql<string>`${person.description}`.as("description"),
              sortOrder:
                sql<number>`coalesce((select max(sort_order) + 1 from staff where shop_id = ${shop.id}), 0)`.as(
                  "sort_order",
                ),
            })
            .from(shops)
            .where(
              and(
                eq(shops.id, shop.id),
                sql`((select count(*) from staff where shop_id = ${shop.id}) < 50 or exists (select 1 from staff where shop_id = ${shop.id} and client_id = ${clientId}))`,
              ),
            ),
        )
        .onConflictDoUpdate({ target: [staff.shopId, staff.clientId], set: person })
        .returning({ id: staff.id }),
      db
        .update(shops)
        .set({ updatedAt })
        .where(
          and(
            eq(shops.id, shop.id),
            sql`exists (select 1 from staff where shop_id = ${shop.id} and client_id = ${clientId})`,
          ),
        ),
    ]);
    if (!saved.length) throw new HTTPException(409, { message: "最多支持 50 位服务人员" });
    return c.json({ updatedAt });
  })
  .delete("/staff/:id", requireMerchant, async (c) => {
    const clientId = c.req.param("id");
    if (!clientId || clientId.length > 100)
      throw new HTTPException(400, { message: "人员标识无效" });
    const db = createDb(c.env.DB);
    const [shop] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(eq(shops.ownerId, c.get("userId")))
      .limit(1);
    if (!shop) throw new HTTPException(404, { message: "店铺不存在" });
    const updatedAt = Date.now();
    await db.batch([
      db.delete(staff).where(and(eq(staff.shopId, shop.id), eq(staff.clientId, clientId))),
      db.update(shops).set({ updatedAt }).where(eq(shops.id, shop.id)),
    ]);
    return c.json({ updatedAt });
  })
  .put("/profile", async (c) => {
    if (c.get("role") !== "customer" && c.get("role") !== "merchant")
      throw new HTTPException(403, {
        message: "超级管理员请通过店铺管理编辑已有店铺，不能创建店铺",
      });
    const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      throw new HTTPException(400, { message: "请完善店铺和人员资料，最多支持 50 位人员" });
    const db = createDb(c.env.DB);
    const ownerId = c.get("userId");
    const shopId = `shop-${ownerId}`;
    const { shop, staff: people } = parsed.data;
    const updatedAt = Date.now();
    // Stable, unguessable public IDs; clients cannot choose another merchant's identifiers.
    const records = await Promise.all(
      people.map(async ({ id, ...person }, index) => ({
        ...person,
        clientId: id,
        shopId,
        sortOrder: index,
        id: await sha256(`${ownerId}:${id}`),
      })),
    );
    // D1 batch is atomic: a failed write never leaves a partially published profile.
    await db.batch([
      db
        .update(users)
        .set({ role: "merchant", updatedAt })
        .where(and(eq(users.id, ownerId), eq(users.role, "customer"))),
      db
        .insert(shops)
        .values({ id: shopId, ownerId, ...shop, updatedAt })
        .onConflictDoUpdate({ target: shops.ownerId, set: { ...shop, updatedAt } }),
      db.delete(staff).where(eq(staff.shopId, shopId)),
      ...Array.from({ length: Math.ceil(records.length / 10) }, (_, index) =>
        db.insert(staff).values(records.slice(index * 10, index * 10 + 10)),
      ),
    ]);
    return c.json({ updatedAt });
  })
  .route("/", merchantBookingRoutes);

export const publicRoutes = new Hono<AppEnv>().get("/staff/:id", async (c) => {
  const id = c.req.param("id");
  if (!/^[a-f0-9]{64}$/.test(id))
    throw new HTTPException(404, { message: "名片不存在或暂不可查看" });
  const [profile] = await createDb(c.env.DB)
    .select({
      shop: shopFields,
      staff: {
        id: staff.id,
        name: staff.name,
        title: staff.title,
        skills: staff.skills,
        description: staff.description,
      },
    })
    .from(staff)
    .innerJoin(shops, eq(staff.shopId, shops.id))
    .innerJoin(users, eq(shops.ownerId, users.id))
    .where(and(eq(staff.id, id), eq(users.status, "active"), eq(shops.status, "active")))
    .limit(1);
  if (!profile) throw new HTTPException(404, { message: "名片不存在或暂不可查看" });
  c.header("Cache-Control", "no-store");
  return c.json(profile);
});

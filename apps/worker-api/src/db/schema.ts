import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const roles = ["customer", "merchant", "super_admin"] as const;
export type Role = (typeof roles)[number];
export const bookingStatuses = [
  "pending",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    appId: text("app_id").notNull(),
    openid: text("openid").notNull(),
    phone: text("phone"),
    role: text("role", { enum: roles }).notNull().default("customer"),
    status: text("status", { enum: ["active", "disabled"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("users_app_openid_unique").on(table.appId, table.openid)],
);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const shops = sqliteTable(
  "shops",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .unique()
      .references(() => users.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),
    businessHours: text("business_hours").notNull(),
    status: text("status", { enum: ["active", "disabled"] })
      .notNull()
      .default("active"),
    statusReason: text("status_reason").notNull().default(""),
    moderationVersion: integer("moderation_version").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("shops_updated_idx").on(table.updatedAt, table.id),
    index("shops_status_updated_idx").on(table.status, table.updatedAt, table.id),
  ],
);

export const staff = sqliteTable(
  "staff",
  {
    id: text("id").primaryKey(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    skills: text("skills").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [uniqueIndex("staff_shop_client_unique").on(table.shopId, table.clientId)],
);

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id),
    // Deliberately not a staff FK: deleting a presentation record preserves history.
    staffPublicId: text("staff_public_id").notNull(),
    shopName: text("shop_name").notNull(),
    shopAddress: text("shop_address").notNull(),
    shopPhone: text("shop_phone").notNull(),
    staffName: text("staff_name").notNull(),
    staffTitle: text("staff_title").notNull(),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    requestedAt: integer("requested_at").notNull(),
    note: text("note").notNull(),
    status: text("status", { enum: bookingStatuses }).notNull().default("pending"),
    requestKey: text("request_key").notNull(),
    payloadHash: text("payload_hash").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("bookings_customer_request_unique").on(table.customerId, table.requestKey),
    index("bookings_customer_created_idx").on(table.customerId, table.createdAt, table.id),
    index("bookings_shop_created_idx").on(table.shopId, table.createdAt, table.id),
  ],
);

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id),
    action: text("action", { enum: ["disable_shop", "restore_shop"] }).notNull(),
    reason: text("reason").notNull(),
    previousStatus: text("previous_status").notNull(),
    nextStatus: text("next_status").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("admin_audit_shop_created_idx").on(table.shopId, table.createdAt, table.id)],
);

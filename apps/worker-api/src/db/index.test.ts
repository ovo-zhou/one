import { readdir, readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { createDb } from "./index";
import { users } from "./schema";

it("applies generated migrations and supports ORM CRUD on isolated local D1", async () => {
  const platform = await getPlatformProxy<Env>({ persist: false, remoteBindings: false });

  try {
    const directory = new URL("../../migrations/", import.meta.url);
    const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const sql = await readFile(new URL(file, directory), "utf8");
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) {
          await platform.env.DB.prepare(statement).run();
        }
      }
    }

    const db = createDb(platform.env.DB);
    const [created] = await db
      .insert(users)
      .values({ name: "Ryan", email: "ryan@example.com" })
      .returning();

    expect(created).toMatchObject({ name: "Ryan", email: "ryan@example.com" });
    expect(created?.createdAt).toBeTruthy();
    if (!created) throw new Error("Expected an inserted user");

    const rows = await db.select().from(users).where(eq(users.id, created.id));
    expect(rows).toEqual([created]);

    await expect(
      db.insert(users).values({ name: "Duplicate", email: "ryan@example.com" }).run(),
    ).rejects.toThrow();

    await db.update(users).set({ name: "Updated" }).where(eq(users.id, created.id));
    expect(await db.select().from(users)).toEqual([{ ...created, name: "Updated" }]);

    await db.delete(users).where(eq(users.id, created.id));
    expect(await db.select().from(users)).toEqual([]);
  } finally {
    await platform.dispose();
  }
}, 30_000);

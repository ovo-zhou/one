import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Use the current request's binding; local and production databases stay separate.
export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

import { z } from "zod";
import { HTTPException } from "hono/http-exception";

const querySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    before: z.coerce.number().int().nonnegative().optional(),
    afterId: z.string().min(1).max(100).optional(),
  })
  .refine((value) => (value.before === undefined) === (value.afterId === undefined));

export function pagination(query: Record<string, string>) {
  const result = querySchema.safeParse(query);
  if (!result.success) throw new HTTPException(400, { message: "分页参数无效" });
  return result.data;
}

export function pageResult<T extends { id: string }>(
  rows: T[],
  limit: number,
  timestamp: (row: T) => number,
) {
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return {
    items,
    next: rows.length > limit && last ? { before: timestamp(last), afterId: last.id } : null,
  };
}

import { z } from "zod";

const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);
export const businessHoursSchema = z
  .array(
    z.object({
      days: z.array(z.number().int().min(1).max(7)).min(1).max(7),
      start: time,
      end: time,
    }),
  )
  .max(7)
  .superRefine((groups, ctx) => {
    const used = new Set<number>();
    for (const group of groups) {
      if (group.start >= group.end)
        ctx.addIssue({ code: "custom", message: "结束时间必须晚于开始时间" });
      for (const day of group.days) {
        if (used.has(day))
          ctx.addIssue({ code: "custom", message: "同一星期不能重复配置营业时间" });
        used.add(day);
      }
    }
  });

// Keep the existing TEXT column; new writes store validated JSON, old text stays readable.
export function readBusinessHours(value: string) {
  try {
    const parsed = businessHoursSchema.safeParse(JSON.parse(value));
    if (parsed.success) return { businessHours: parsed.data, legacyBusinessHours: "" };
  } catch {
    /* Legacy free-text hours are intentionally not guessed. */
  }
  return { businessHours: [], legacyBusinessHours: value };
}

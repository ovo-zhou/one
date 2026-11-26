export type BusinessHours = { days: number[]; start: string; end: string }[];

export const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function businessHoursMessage(value: unknown): string {
  if (!Array.isArray(value) || value.length > 7) return "营业时间最多支持 7 组";
  const used = new Set<number>();
  for (const group of value) {
    if (!group || !Array.isArray(group.days) || !group.days.length || group.days.length > 7)
      return "每组营业时间至少选择一天";
    if (
      typeof group.start !== "string" ||
      typeof group.end !== "string" ||
      !timePattern.test(group.start) ||
      !timePattern.test(group.end)
    )
      return "请选择有效的开始和结束时间";
    if (group.start >= group.end) return "结束时间必须晚于开始时间";
    for (const day of group.days) {
      if (!Number.isInteger(day) || day < 1 || day > 7) return "请选择有效的星期";
      if (used.has(day)) return "同一星期不能重复配置营业时间";
      used.add(day);
    }
  }
  return "";
}

export function businessHoursRows(hours: BusinessHours) {
  return hours
    .map((group, index) => {
      const days = [...group.days].sort((a, b) => a - b);
      const consecutive =
        days.length >= 3 && days.every((day, i) => i === 0 || day === days[i - 1]! + 1);
      return {
        index,
        daysLabel: consecutive
          ? `${weekdays[days[0]! - 1]}至${weekdays[days[days.length - 1]! - 1]}`
          : days.map((day) => weekdays[day - 1]).join("、"),
        timeLabel: `${group.start}–${group.end}`,
      };
    })
    .sort((a, b) => Math.min(...hours[a.index]!.days) - Math.min(...hours[b.index]!.days));
}

// Preserve old free text without guessing its meaning or losing the rest of a draft.
export function normalizeBusinessHours(
  value: unknown,
  legacy = "",
): { businessHours: BusinessHours; legacyBusinessHours: string } {
  if (typeof value === "string") return { businessHours: [], legacyBusinessHours: value };
  return {
    businessHours: businessHoursMessage(value) ? [] : (value as BusinessHours),
    legacyBusinessHours: legacy,
  };
}

import type { Booking, BookingStatus } from "../api/bookings";

export const bookingLabels: Record<BookingStatus, string> = {
  pending: "待商家确认",
  confirmed: "已确认",
  completed: "已完成",
  rejected: "已拒绝",
  cancelled: "已取消",
};
export function formatTime(value: number): string {
  const date = new Date(value + 8 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}
export function bookingView(booking: Booking) {
  return {
    ...booking,
    statusLabel: bookingLabels[booking.status],
    timeLabel: formatTime(booking.requestedAt),
    createdLabel: formatTime(booking.createdAt),
  };
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败，请重试";
}

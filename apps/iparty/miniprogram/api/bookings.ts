import { authenticatedRequest } from "../utils/authenticated-request";

export type BookingStatus = "pending" | "confirmed" | "completed" | "rejected" | "cancelled";
export type Booking = {
  id: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopWechat: string;
  shopQq: string;
  staffName: string;
  staffTitle: string;
  contactName: string;
  contactPhone: string;
  requestedAt: number;
  note: string;
  status: BookingStatus;
  createdAt: number;
  updatedAt: number;
};
export type Cursor = { before: number; afterId: string } | null;
export type ListResult<T> = { items: T[]; next: Cursor };
export function cursorQuery(cursor: Cursor): string {
  return cursor ? `?before=${cursor.before}&afterId=${encodeURIComponent(cursor.afterId)}` : "";
}
export function createBooking(data: {
  staffId: string;
  contactName: string;
  contactPhone: string;
  requestedAt: number;
  note: string;
  requestKey: string;
  consent: true;
}) {
  return authenticatedRequest<{ id: string }>("/api/v1/customer/bookings", {
    method: "POST",
    data,
  });
}
export function listBookings(merchant: boolean, cursor: Cursor) {
  return authenticatedRequest<ListResult<Booking>>(
    `/api/v1/${merchant ? "merchant" : "customer"}/bookings${cursorQuery(cursor)}`,
  );
}
export function getBooking(id: string) {
  return authenticatedRequest<{ booking: Booking }>(
    `/api/v1/customer/bookings/${encodeURIComponent(id)}`,
  );
}
export function cancelBooking(id: string) {
  return authenticatedRequest<{ id: string }>(
    `/api/v1/customer/bookings/${encodeURIComponent(id)}/cancel`,
    { method: "PUT" },
  );
}
export function setBookingStatus(id: string, status: "confirmed" | "rejected" | "completed") {
  return authenticatedRequest<{ id: string }>(
    `/api/v1/merchant/bookings/${encodeURIComponent(id)}/status`,
    { method: "PUT", data: { status } },
  );
}

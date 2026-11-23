import { authenticatedRequest } from "../utils/authenticated-request";
import { cursorQuery, type Cursor, type ListResult } from "./bookings";

export type ShopSummary = {
  id: string;
  name: string;
  address: string;
  status: "active" | "disabled";
  ownerStatus: string;
  staffCount: number;
  updatedAt: number;
};
export type AdminShop = Omit<ShopSummary, "staffCount"> & {
  ownerId: string;
  description: string;
  phone: string;
  businessHours: string;
  statusReason: string;
  moderationVersion: number;
};
export type AdminStaff = {
  publicId: string;
  name: string;
  title: string;
  skills: string;
  description: string;
};
export type AuditLog = {
  id: string;
  actorId: string;
  shopId: string;
  action: string;
  reason: string;
  previousStatus: string;
  nextStatus: string;
  createdAt: number;
};
export function listShops(q: string, status: string, cursor: Cursor) {
  const paging = cursorQuery(cursor);
  return authenticatedRequest<ListResult<ShopSummary>>(
    `/api/v1/admin/shops${paging || "?"}${paging ? "&" : ""}q=${encodeURIComponent(q)}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
  );
}
export function getAdminShop(id: string) {
  return authenticatedRequest<{ shop: AdminShop; staff: AdminStaff[] }>(
    `/api/v1/admin/shops/${encodeURIComponent(id)}`,
  );
}
export function changeShopStatus(
  id: string,
  status: "active" | "disabled",
  reason: string,
  version: number,
) {
  return authenticatedRequest<{ updatedAt: number }>(
    `/api/v1/admin/shops/${encodeURIComponent(id)}/status`,
    { method: "PUT", data: { status, reason, version } },
  );
}
export function listAudit(id: string, cursor: Cursor) {
  return authenticatedRequest<ListResult<AuditLog>>(
    `/api/v1/admin/shops/${encodeURIComponent(id)}/audit${cursorQuery(cursor)}`,
  );
}

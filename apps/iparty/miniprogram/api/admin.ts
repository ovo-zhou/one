import { authenticatedRequest } from "../utils/authenticated-request";
import { request, RequestError } from "../utils/request";
import { getSessionRevision, getToken, updateAccount } from "../utils/session";
import { getApiBaseUrl } from "../config/api";
import type { Account } from "../models/account";
import { cursorQuery, type Cursor, type ListResult } from "./bookings";
import type { BusinessHours } from "../utils/business-hours";
import {
  adminShopAuditGroup,
  adminShopDetailsGroup,
  adminShopsGroup,
  merchantProfileGroup,
} from "./cache-groups";

export type ShopSummary = {
  id: string;
  name: string;
  address: string;
  status: "active" | "disabled";
  ownerStatus: string;
  staffCount: number;
  createdAt: number;
  updatedAt: number;
};
export type AdminShop = Omit<ShopSummary, "staffCount" | "createdAt"> & {
  ownerId: string;
  description: string;
  locationName: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  phone: string;
  wechat: string;
  qq: string;
  businessHours: BusinessHours;
  legacyBusinessHours?: string;
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

const pendingAdminChecks = new Map<string, Promise<void>>();

function validateAdminCacheHit(): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();
  const revision = getSessionRevision();
  const key = JSON.stringify([baseUrl, token, revision]);
  const pending = pendingAdminChecks.get(key);
  if (pending) return pending;

  // On cache misses the admin endpoint itself checks permissions. On a hit,
  // recheck the role without repeating the heavier list/detail/audit query.
  const check = request<{ user: Account }>("/api/v1/auth/me")
    .then(({ user }) => {
      if (getApiBaseUrl() !== baseUrl || getToken() !== token || getSessionRevision() !== revision) {
        throw new Error("登录状态已变化，请重试");
      }
      updateAccount(user);
      if (user.role !== "super_admin") throw new RequestError("仅超级管理员可访问", 403);
    })
    .finally(() => pendingAdminChecks.delete(key));
  pendingAdminChecks.set(key, check);
  return check;
}

function adminCache(group: string, refresh: boolean) {
  return { group, refresh, validateHit: validateAdminCacheHit };
}

export function listShops(q: string, status: string, cursor: Cursor, refresh = false) {
  const paging = cursorQuery(cursor);
  return authenticatedRequest<ListResult<ShopSummary>>(
    `/api/v1/admin/shops${paging || "?"}${paging ? "&" : ""}q=${encodeURIComponent(q)}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
    { cache: adminCache(adminShopsGroup, refresh) },
  );
}
export function getAdminShop(id: string, refresh = false) {
  return authenticatedRequest<{ shop: AdminShop; staff: AdminStaff[] }>(
    `/api/v1/admin/shops/${encodeURIComponent(id)}`,
    { cache: adminCache(adminShopDetailsGroup(id), refresh) },
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
    {
      method: "PUT",
      data: { status, reason, version },
      invalidates: [
        adminShopsGroup,
        adminShopDetailsGroup(id),
        adminShopAuditGroup(id),
        merchantProfileGroup,
      ],
    },
  );
}
export function listAudit(id: string, cursor: Cursor, refresh = false) {
  return authenticatedRequest<ListResult<AuditLog>>(
    `/api/v1/admin/shops/${encodeURIComponent(id)}/audit${cursorQuery(cursor)}`,
    { cache: adminCache(adminShopAuditGroup(id), refresh) },
  );
}

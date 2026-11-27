import type { OnboardingDraft, ShopDraft, StaffDraft } from "../models/draft";
import { request } from "../utils/request";
import { authenticatedRequest } from "../utils/authenticated-request";
import { adminShopGroup, adminShopsGroup, merchantProfileGroup } from "./cache-groups";

export type MerchantProfile = {
  shop: ShopDraft;
  staff: (StaffDraft & { publicId: string })[];
  updatedAt: number;
  status: "active" | "disabled";
  statusReason: string;
};

// The same shop and staff also appear in the administrator's views.
const profileChanges = [merchantProfileGroup, adminShopsGroup, adminShopGroup];

export function getMerchantProfile(refresh = false) {
  return authenticatedRequest<{ profile: MerchantProfile | null }>("/api/v1/merchant/profile", {
    cache: { group: merchantProfileGroup, refresh },
  });
}

export function publishProfile(draft: OnboardingDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/profile", {
    method: "PUT",
    data: { shop: draft.shop, staff: draft.staff },
    invalidates: profileChanges,
  });
}

export function updateShop(shop: ShopDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/shop", {
    method: "PUT",
    data: shop,
    invalidates: profileChanges,
  });
}

export function saveStaff(person: StaffDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/staff", {
    method: "PUT",
    data: person,
    invalidates: profileChanges,
  });
}

export function getPublicStaff(id: string) {
  // A deleted staff member or a stopped shop must not be served from a local cache.
  return request<{ shop: ShopDraft; staff: StaffDraft }>(
    `/api/v1/public/staff/${encodeURIComponent(id)}`,
  );
}

export function deleteStaff(id: string) {
  return authenticatedRequest<{ updatedAt: number }>(
    `/api/v1/merchant/staff/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      invalidates: profileChanges,
    },
  );
}

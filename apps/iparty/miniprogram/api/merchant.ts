import type { OnboardingDraft, ShopDraft, StaffDraft } from "../models/draft";
import { request } from "../utils/request";
import { authenticatedRequest } from "../utils/authenticated-request";

export type MerchantProfile = {
  shop: ShopDraft;
  staff: (StaffDraft & { publicId: string })[];
  updatedAt: number;
  status: "active" | "disabled";
  statusReason: string;
};

export function getMerchantProfile() {
  return authenticatedRequest<{ profile: MerchantProfile | null }>("/api/v1/merchant/profile");
}

export function publishProfile(draft: OnboardingDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/profile", {
    method: "PUT",
    data: { shop: draft.shop, staff: draft.staff },
  });
}

export function updateShop(shop: ShopDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/shop", {
    method: "PUT",
    data: shop,
  });
}

export function saveStaff(person: StaffDraft) {
  return authenticatedRequest<{ updatedAt: number }>("/api/v1/merchant/staff", {
    method: "PUT",
    data: person,
  });
}

export function getPublicStaff(id: string) {
  return request<{ shop: ShopDraft; staff: StaffDraft }>(
    `/api/v1/public/staff/${encodeURIComponent(id)}`,
  );
}

export function deleteStaff(id: string) {
  return authenticatedRequest<{ updatedAt: number }>(
    `/api/v1/merchant/staff/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

import type { ShopDraft } from "../models/draft";

type Coordinates = { latitude?: number | null; longitude?: number | null };

export function hasShopLocation(shop: Coordinates): boolean {
  return (
    typeof shop.latitude === "number" &&
    Number.isFinite(shop.latitude) &&
    Math.abs(shop.latitude) <= 90 &&
    typeof shop.longitude === "number" &&
    Number.isFinite(shop.longitude) &&
    Math.abs(shop.longitude) <= 180
  );
}

export function shopAddress(shop: Pick<ShopDraft, "address" | "addressDetail">): string {
  return [shop.address, shop.addressDetail].filter(Boolean).join(" ");
}

export const merchantProfileGroup = "merchant-profile";
export const adminShopsGroup = "admin-shops";
export const adminShopGroup = "admin-shop";

export function adminShopDetailsGroup(id: string): string {
  return `${adminShopGroup}/${encodeURIComponent(id)}`;
}

export function adminShopAuditGroup(id: string): string {
  return `admin-audit/${encodeURIComponent(id)}`;
}

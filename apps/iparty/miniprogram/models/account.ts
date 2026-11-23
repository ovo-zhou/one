export type Role = "customer" | "merchant" | "super_admin";
export type Account = { id: string; role: Role };
export function isRole(value: unknown): value is Role {
  return value === "customer" || value === "merchant" || value === "super_admin";
}
export function centerPath(role?: Role): string {
  return role === "super_admin" ? "/pages/admin/index" : "/pages/manage/index";
}

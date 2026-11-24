export type Role = "customer" | "merchant" | "super_admin";
export type Account = { id: string; role: Role };
export function isRole(value: unknown): value is Role {
  return value === "customer" || value === "merchant" || value === "super_admin";
}
export function centerPath(): string {
  return "/pages/manage/index";
}
export function accountPermissions(role?: Role) {
  return {
    canBook: isRole(role),
    canCreateShop: role === "customer",
    canManageShop: role === "merchant" || role === "super_admin",
    canManagePlatform: role === "super_admin",
  };
}

const centerFeatures = [
  {
    id: "shop",
    permission: "canManageShop",
    title: "店铺管理",
    description: "编辑店铺介绍、地址与联系方式",
    url: "/pages/onboarding/shop/index?mode=edit",
  },
  {
    id: "staff",
    permission: "canManageShop",
    title: "服务人员管理",
    description: "添加、编辑和预览服务人员资料",
    url: "/pages/manage/staff/index",
  },
  {
    id: "appointments",
    permission: "canManageShop",
    title: "预约管理",
    description: "查看、确认和处理客户预约",
    url: "/pages/manage/appointments/index",
  },
  {
    id: "bookings",
    permission: "canBook",
    title: "我的预约",
    description: "查看我向其他店铺提交的预约",
    url: "/pages/customer/bookings/index",
  },
  {
    id: "platform",
    permission: "canManagePlatform",
    title: "平台店铺管理",
    description: "搜索、查看和管理平台店铺状态",
    url: "/pages/admin/index",
  },
] as const;

export function centerFeaturesFor(role?: Role) {
  const permissions = accountPermissions(role);
  return centerFeatures.filter((feature) => permissions[feature.permission]);
}

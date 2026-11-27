import { emptyShop, type OnboardingDraft, type ShopDraft, type StaffDraft } from "../models/draft";
import { hasShopLocation } from "./shop-location";
import { businessHoursMessage, normalizeBusinessHours } from "./business-hours";

const storageKey = "iparty:onboarding:v2";
export const draftSaveError = "草稿保存失败，请检查设备存储空间";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShop(
  value: unknown,
): value is Omit<ShopDraft, "wechat" | "qq" | "businessHours"> &
  Partial<Pick<ShopDraft, "wechat" | "qq">> & { businessHours: unknown } {
  return (
    isRecord(value) &&
    ["name", "description", "address", "locationName", "addressDetail", "phone"].every(
      (key) => typeof value[key] === "string",
    ) &&
    ["wechat", "qq"].every((key) => value[key] === undefined || typeof value[key] === "string") &&
    (typeof value.businessHours === "string" || !businessHoursMessage(value.businessHours)) &&
    (value.legacyBusinessHours === undefined || typeof value.legacyBusinessHours === "string") &&
    ((value.latitude === null && value.longitude === null) ||
      (typeof value.latitude === "number" &&
        typeof value.longitude === "number" &&
        hasShopLocation({ latitude: value.latitude, longitude: value.longitude })))
  );
}

function isStaff(value: unknown): value is StaffDraft {
  return (
    isRecord(value) &&
    ["id", "name", "title", "skills", "description"].every((key) => typeof value[key] === "string")
  );
}

export function readDraft(): OnboardingDraft {
  const value: unknown = wx.getStorageSync(storageKey);

  if (
    isRecord(value) &&
    value.version === 2 &&
    isShop(value.shop) &&
    Array.isArray(value.staff) &&
    value.staff.every(isStaff) &&
    typeof value.updatedAt === "number"
  ) {
    return {
      version: 2,
      shop: {
        ...emptyShop(),
        ...value.shop,
        ...normalizeBusinessHours(value.shop.businessHours, value.shop.legacyBusinessHours),
      },
      staff: value.staff,
      updatedAt: value.updatedAt,
    };
  }

  return { version: 2, shop: emptyShop(), staff: [], updatedAt: 0 };
}

export function saveDraft(draft: OnboardingDraft): boolean {
  try {
    wx.setStorageSync(storageKey, { ...draft, updatedAt: Date.now() });
    return true;
  } catch {
    return false;
  }
}

export type ShopFieldErrors = Partial<
  Record<
    "name" | "description" | "location" | "addressDetail" | "contact" | "wechat" | "qq" | "phone" | "businessHours",
    string
  >
>;

export function shopFieldErrors(shop: ShopDraft): ShopFieldErrors {
  const errors: ShopFieldErrors = {};
  if (!shop.name.trim()) errors.name = "请填写店铺名称";
  else if (shop.name.trim().length > 40) errors.name = "店铺名称最多 40 字";
  if (shop.description.trim().length > 500) errors.description = "店铺介绍最多 500 字";
  if (!hasShopLocation(shop) || !shop.address.trim() || !shop.locationName.trim())
    errors.location = "请在地图上选择门店位置";
  else if (shop.address.length > 200) errors.location = "门店地址最多 200 字";
  else if (shop.locationName.length > 100) errors.location = "位置名称最多 100 字";
  if (shop.addressDetail.length > 120) errors.addressDetail = "详细地址最多 120 字";
  const wechat = shop.wechat.trim();
  const qq = shop.qq.trim();
  const phone = shop.phone.trim();
  if (!wechat && !qq && !phone) errors.contact = "微信、QQ、电话至少填写一项";
  if (wechat && (wechat.length > 64 || /\s/.test(wechat)))
    errors.wechat = "微信号最多 64 位，不能包含空格";
  if (qq && !/^[1-9][0-9]{4,11}$/.test(qq)) errors.qq = "请填写有效的 QQ 号（5–12 位数字）";
  if (phone && !/^[0-9+()\-\s]{7,25}$/.test(phone))
    errors.phone = "请填写有效的店铺电话（7–25 位）";
  const hoursMessage = shop.legacyBusinessHours
    ? "请重新选择营业时间，或清除原文字设置"
    : businessHoursMessage(shop.businessHours);
  if (hoursMessage) errors.businessHours = hoursMessage;
  return errors;
}

export type StaffFieldErrors = Partial<Record<Exclude<keyof StaffDraft, "id">, string>>;

export function staffFieldErrors(staff: StaffDraft): StaffFieldErrors {
  const errors: StaffFieldErrors = {};
  if (!staff.name.trim()) errors.name = "请填写人员姓名或昵称";
  else if (staff.name.trim().length > 30) errors.name = "姓名或昵称最多 30 字";
  if (!staff.title.trim()) errors.title = "请填写岗位名称";
  else if (staff.title.trim().length > 40) errors.title = "岗位名称最多 40 字";
  if (!staff.skills.trim()) errors.skills = "请填写擅长项目";
  else if (staff.skills.trim().length > 150) errors.skills = "擅长项目最多 150 字";
  if (staff.description.trim().length > 600) errors.description = "个人介绍最多 600 字";
  return errors;
}

export function isDraftReady(draft: OnboardingDraft): boolean {
  return (
    !Object.keys(shopFieldErrors(draft.shop)).length &&
    draft.staff.length > 0 &&
    draft.staff.every((staff) => !Object.keys(staffFieldErrors(staff)).length)
  );
}

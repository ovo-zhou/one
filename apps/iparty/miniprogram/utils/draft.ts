import { emptyShop, type OnboardingDraft, type ShopDraft, type StaffDraft } from "../models/draft";
import { hasShopLocation } from "./shop-location";
import { businessHoursMessage, normalizeBusinessHours } from "./business-hours";

const storageKey = "iparty:onboarding:v2";

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
    wx.showToast({ title: "草稿保存失败，请检查设备存储空间", icon: "none" });
    return false;
  }
}

export function shopValidationMessage(shop: ShopDraft): string {
  if (!shop.name.trim()) return "请填写店铺名称";
  if (!hasShopLocation(shop) || !shop.address.trim() || !shop.locationName.trim())
    return "请在地图上选择门店位置";
  if (shop.address.length > 200) return "门店地址最多 200 字";
  if (shop.addressDetail.length > 120) return "详细地址最多 120 字";
  if (shop.locationName.length > 100) return "位置名称最多 100 字";
  const wechat = shop.wechat.trim();
  const qq = shop.qq.trim();
  const phone = shop.phone.trim();
  if (!wechat && !qq && !phone) return "微信、QQ、电话至少填写一项";
  if (wechat && (wechat.length > 64 || /\s/.test(wechat))) return "微信号最多 64 位，不能包含空格";
  if (qq && !/^[1-9][0-9]{4,11}$/.test(qq)) return "请填写有效的 QQ 号（5–12 位数字）";
  if (phone && !/^[0-9+()\-\s]{7,25}$/.test(phone)) return "请填写有效的店铺电话（7–25 位）";
  if (shop.legacyBusinessHours) return "请重新选择营业时间，或清除原文字设置";
  const hoursMessage = businessHoursMessage(shop.businessHours);
  if (hoursMessage) return hoursMessage;
  return "";
}

export function staffValidationMessage(staff: StaffDraft): string {
  if (!staff.name.trim()) return "请填写人员姓名或昵称";
  if (!staff.title.trim()) return "请填写岗位名称";
  if (!staff.skills.trim()) return "请填写擅长项目";
  return "";
}

export function isDraftReady(draft: OnboardingDraft): boolean {
  return (
    !shopValidationMessage(draft.shop) &&
    draft.staff.length > 0 &&
    draft.staff.every((staff) => !staffValidationMessage(staff))
  );
}

import { emptyShop, type OnboardingDraft, type ShopDraft, type StaffDraft } from "../models/draft";
import { hasShopLocation } from "./shop-location";

const storageKey = "iparty:onboarding:v2";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShop(value: unknown): value is ShopDraft {
  return (
    isRecord(value) &&
    [
      "name",
      "description",
      "address",
      "locationName",
      "addressDetail",
      "phone",
      "businessHours",
    ].every((key) => typeof value[key] === "string") &&
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
      shop: value.shop,
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
  if (!/^[0-9+()\-\s]{7,25}$/.test(shop.phone.trim())) return "请填写有效的店铺联系电话";
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

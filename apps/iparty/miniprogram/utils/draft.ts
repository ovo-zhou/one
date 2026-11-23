import { emptyShop, type OnboardingDraft, type ShopDraft, type StaffDraft } from "../models/draft";

const storageKey = "iparty:onboarding:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isShop(value: unknown): value is ShopDraft {
  return (
    isRecord(value) &&
    ["name", "industry", "description", "address", "phone", "businessHours"].every(
      (key) => typeof value[key] === "string",
    )
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
    value.version === 1 &&
    isShop(value.shop) &&
    Array.isArray(value.staff) &&
    value.staff.every(isStaff) &&
    typeof value.updatedAt === "number"
  ) {
    return value as OnboardingDraft;
  }

  return { version: 1, shop: emptyShop(), staff: [], updatedAt: 0 };
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
  if (!shop.industry.trim()) return "请选择服务行业";
  if (!shop.address.trim()) return "请填写服务地址或服务区域";
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

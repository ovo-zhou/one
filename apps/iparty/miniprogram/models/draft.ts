export const industries = ["SPA 养生", "美容美体", "家政服务", "美发美甲", "其他服务"];

export type ShopDraft = {
  name: string;
  industry: string;
  description: string;
  address: string;
  phone: string;
  businessHours: string;
};

export type StaffDraft = {
  id: string;
  name: string;
  title: string;
  skills: string;
  description: string;
};

export type OnboardingDraft = {
  version: 1;
  shop: ShopDraft;
  staff: StaffDraft[];
  updatedAt: number;
};

export function emptyShop(): ShopDraft {
  return {
    name: "",
    industry: industries[0]!,
    description: "",
    address: "",
    phone: "",
    businessHours: "",
  };
}

export function emptyStaff(): StaffDraft {
  return { id: "", name: "", title: "", skills: "", description: "" };
}

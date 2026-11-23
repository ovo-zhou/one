export type ShopDraft = {
  name: string;
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
    description: "",
    address: "",
    phone: "",
    businessHours: "",
  };
}

export function emptyStaff(): StaffDraft {
  return { id: "", name: "", title: "", skills: "", description: "" };
}

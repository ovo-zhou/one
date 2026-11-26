import type { BusinessHours } from "../utils/business-hours";

export type ShopDraft = {
  name: string;
  description: string;
  address: string;
  locationName: string;
  addressDetail: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  wechat: string;
  qq: string;
  businessHours: BusinessHours;
  legacyBusinessHours?: string;
};

export type StaffDraft = {
  id: string;
  name: string;
  title: string;
  skills: string;
  description: string;
};

export type OnboardingDraft = {
  version: 2;
  shop: ShopDraft;
  staff: StaffDraft[];
  updatedAt: number;
};

export function emptyShop(): ShopDraft {
  return {
    name: "",
    description: "",
    address: "",
    locationName: "",
    addressDetail: "",
    latitude: null,
    longitude: null,
    phone: "",
    wechat: "",
    qq: "",
    businessHours: [],
  };
}

export function emptyStaff(): StaffDraft {
  return { id: "", name: "", title: "", skills: "", description: "" };
}

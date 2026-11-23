import type { StaffDraft } from "../models/draft";

export function staffShareContent(
  publicId: string,
  shopName: string,
  staff: Pick<StaffDraft, "name" | "title">,
): WechatMiniprogram.Page.ICustomShareContent {
  return {
    title: [shopName, staff.name, staff.title].filter(Boolean).join(" · "),
    // Never share a local client ID, merchant route, token, or preview flag.
    path: `/pages/staff/detail/index?id=${encodeURIComponent(publicId)}`,
  };
}

export function introShareContent(): WechatMiniprogram.Page.ICustomShareContent {
  return { title: "iparty · 店铺与服务人员名片", path: "/pages/index/index?intro=1" };
}

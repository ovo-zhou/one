import { demoShop, demoStaff } from "../../../data/demo";
import { emptyShop, emptyStaff } from "../../../models/draft";
import { readDraft } from "../../../utils/draft";

Page({
  data: { shop: emptyShop(), staff: emptyStaff(), mode: "", available: false },
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    if (query.mode === "demo") {
      this.setData({ mode: "demo", shop: demoShop, staff: demoStaff, available: true });
      return;
    }
    if (query.mode === "local") {
      const draft = readDraft();
      const staff = draft.staff.find((staff) => staff.id === query.id);
      if (staff) this.setData({ mode: "local", shop: draft.shop, staff, available: true });
    }
    // Public IDs must eventually be resolved by a public API, never from local drafts.
  },
  book() {
    wx.showModal({
      title: "当前仅供预览",
      content: "这张名片尚未公开发布，暂不接收预约，也不会收集你的手机号。",
      showCancel: false,
    });
  },
  contact() {
    wx.showModal({
      title: "当前仅供预览",
      content: "公开发布后，客户可以通过这里联系店铺。当前不会拨打草稿中的电话。",
      showCancel: false,
    });
  },
  home() {
    wx.reLaunch({ url: "/pages/index/index" });
  },
});

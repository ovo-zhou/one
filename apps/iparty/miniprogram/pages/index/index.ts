import { readDraft } from "../../utils/draft";

Page({
  data: { hasDraft: false },
  onShow() {
    const draft = readDraft();
    this.setData({ hasDraft: draft.updatedAt > 0 });
    wx.hideShareMenu();
  },
  start() {
    wx.navigateTo({ url: "/pages/onboarding/shop/index" });
  },
  viewExample() {
    wx.navigateTo({ url: "/pages/staff/detail/index?mode=demo" });
  },
  openManage() {
    wx.navigateTo({ url: "/pages/manage/index" });
  },
});

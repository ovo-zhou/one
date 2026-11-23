import type { StaffDraft } from "../../../models/draft";
import { readDraft, saveDraft } from "../../../utils/draft";

Page({
  data: { staff: [] as StaffDraft[] },
  onShow() {
    this.setData({ staff: readDraft().staff });
    wx.hideShareMenu();
  },
  add() {
    wx.navigateTo({ url: "/pages/onboarding/staff/index?mode=edit" });
  },
  edit(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id);
    wx.navigateTo({ url: `/pages/onboarding/staff/index?mode=edit&id=${encodeURIComponent(id)}` });
  },
  preview(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id);
    wx.navigateTo({ url: `/pages/staff/detail/index?mode=local&id=${encodeURIComponent(id)}` });
  },
  shareNotice() {
    wx.showModal({
      title: "发布后才能分享",
      content: "当前资料仅保存在本机。接入手机号登录和云端发布后，将支持微信分享及推广短链。",
      showCancel: false,
    });
  },
  remove(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id);
    wx.showModal({
      title: "删除本地人员草稿？",
      content: "此操作只影响当前设备，删除后无法恢复。",
      confirmText: "删除",
      confirmColor: "#a34e3c",
      success: (result) => {
        if (!result.confirm) return;
        const draft = readDraft();
        const staff = draft.staff.filter((staff) => staff.id !== id);
        if (saveDraft({ ...draft, staff })) this.setData({ staff });
      },
    });
  },
});

import { deleteStaff, getMerchantProfile, type MerchantProfile } from "../../../api/merchant";
import { introShareContent, staffShareContent } from "../../../utils/staff-share";

Page({
  data: {
    staff: [] as MerchantProfile["staff"],
    shopName: "",
    loading: true,
    refreshing: false,
    error: "",
    shopStatus: "active",
    statusReason: "",
    deleting: false,
  },
  onShow() {
    wx.hideShareMenu();
    void this.loadStaff();
  },
  async loadStaff(refresh = false) {
    this.setData({ loading: true, error: "" });
    try {
      const { profile } = await getMerchantProfile(refresh);
      this.setData({
        staff: profile?.staff ?? [],
        shopName: profile?.shop.name ?? "",
        shopStatus: profile?.status ?? "active",
        statusReason: profile?.statusReason ?? "",
      });
    } catch (error) {
      this.setData({ error: error instanceof Error ? error.message : "人员资料加载失败，请重试" });
    } finally {
      this.setData({ loading: false });
    }
  },
  retry() {
    void this.loadStaff(true);
  },
  async refreshStaff() {
    if (this.data.deleting || this.data.refreshing) return;
    this.setData({ refreshing: true });
    try {
      await this.loadStaff(true);
    } finally {
      this.setData({ refreshing: false });
    }
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
    const person = this.data.staff.find((person) => person.id === id);
    if (this.data.shopStatus !== "active") {
      wx.showToast({ title: "店铺已停用，公开名片暂不可用", icon: "none" });
      return;
    }
    if (person)
      wx.navigateTo({
        url: `/pages/staff/detail/index?preview=1&id=${encodeURIComponent(person.publicId)}`,
      });
  },
  onShareAppMessage(event: WechatMiniprogram.Page.IShareAppMessageOption) {
    // Keep the management page's menu hidden; only a specific person's button
    // can select a card. Unexpected invocations must not share this private route.
    const target = event.target as { dataset?: { id?: string } } | undefined;
    const person =
      event.from === "button"
        ? this.data.staff.find((person) => person.id === target?.dataset?.id)
        : undefined;
    if (
      !person?.publicId ||
      this.data.shopStatus !== "active" ||
      this.data.loading ||
      this.data.error ||
      this.data.deleting
    )
      return introShareContent();
    return staffShareContent(person.publicId, this.data.shopName, person);
  },
  remove(event: WechatMiniprogram.TouchEvent) {
    if (this.data.deleting) return;
    const id = String(event.currentTarget.dataset.id);
    wx.showModal({
      title: "删除服务人员？",
      content: "删除后该人员的公开页面将立即失效，且无法恢复。",
      confirmText: "删除",
      confirmColor: "#a34e3c",
      success: (result) => {
        if (!result.confirm) return;
        void this.deletePerson(id);
      },
    });
  },
  async deletePerson(id: string) {
    if (this.data.deleting) return;
    this.setData({ deleting: true });
    try {
      await deleteStaff(id);
      this.setData({ staff: this.data.staff.filter((person) => person.id !== id) });
      wx.showToast({ title: "已删除", icon: "success" });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "删除失败，请重试",
        icon: "none",
      });
    } finally {
      this.setData({ deleting: false });
    }
  },
});

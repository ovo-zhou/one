import { emptyShop, emptyStaff } from "../../../models/draft";
import { readDraft } from "../../../utils/draft";
import { getPublicStaff } from "../../../api/merchant";
import { introShareContent, staffShareContent } from "../../../utils/staff-share";

Page({
  data: {
    shop: emptyShop(),
    staff: emptyStaff(),
    mode: "",
    preview: true,
    available: false,
    loading: false,
    error: "",
  },
  publicId: "",
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    if (query.mode === "local") {
      const draft = readDraft();
      const staff = draft.staff.find((staff) => staff.id === query.id);
      if (staff) this.setData({ mode: "local", shop: draft.shop, staff, available: true });
      return;
    }
    if (!query.mode && query.id) {
      this.publicId = query.id;
      this.setData({ preview: query.preview === "1" });
      void this.loadPublic(query.id);
    }
  },
  onShow() {
    this.updateShareMenu();
  },
  updateShareMenu() {
    if (this.data.available && this.data.mode === "public" && this.publicId) {
      wx.showShareMenu({ menus: ["shareAppMessage"] });
    } else {
      wx.hideShareMenu();
    }
  },
  onShareAppMessage() {
    if (!this.data.available || this.data.mode !== "public" || !this.publicId)
      return introShareContent();
    // Merchant preview and customer re-sharing both produce a customer entry.
    return staffShareContent(this.publicId, this.data.shop.name, this.data.staff);
  },
  async loadPublic(id: string) {
    this.setData({ loading: true });
    try {
      const profile = await getPublicStaff(id);
      this.setData({ ...profile, mode: "public", available: true }, () => this.updateShareMenu());
    } catch (error) {
      this.setData({ error: error instanceof Error ? error.message : "名片加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  previewBlocked(): boolean {
    if (!this.data.preview && this.data.mode === "public" && this.data.available) return false;
    wx.showModal({
      title: "预览中不可用",
      content: "当前为名片预览，联系商家和预约咨询仅在客户打开公开页面时可用。",
      showCancel: false,
    });
    return true;
  },
  book() {
    if (this.previewBlocked()) return;
    wx.navigateTo({ url: `/pages/customer/booking/index?id=${encodeURIComponent(this.publicId)}` });
  },
  contact() {
    if (this.previewBlocked()) return;
    if (this.data.shop.phone) {
      wx.makePhoneCall({ phoneNumber: this.data.shop.phone });
      return;
    }
    wx.showModal({
      title: "暂时无法联系",
      content: "商家暂未提供联系电话。",
      showCancel: false,
    });
  },
  home() {
    wx.reLaunch({ url: "/pages/index/index?intro=1" });
  },
});

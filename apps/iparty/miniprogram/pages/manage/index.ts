import { ping } from "../../api/system";
import { emptyShop } from "../../models/draft";
import { isDraftReady, readDraft } from "../../utils/draft";

Page({
  data: {
    shop: emptyShop(),
    staffCount: 0,
    hasDraft: false,
    ready: false,
    loginVisible: false,
    checking: false,
    connection: "",
  },
  onShow() {
    const draft = readDraft();
    this.setData({
      shop: draft.shop,
      staffCount: draft.staff.length,
      hasDraft: draft.updatedAt > 0,
      ready: isDraftReady(draft),
    });
    wx.hideShareMenu();
  },
  editShop() {
    wx.navigateTo({ url: "/pages/onboarding/shop/index?mode=edit" });
  },
  openStaff() {
    wx.navigateTo({ url: "/pages/manage/staff/index" });
  },
  openAppointments() {
    wx.navigateTo({ url: "/pages/manage/appointments/index" });
  },
  home() {
    wx.reLaunch({ url: "/pages/index/index" });
  },
  publish() {
    if (!this.data.ready) {
      wx.showToast({ title: "请先完善店铺及至少一位人员资料", icon: "none" });
      return;
    }
    this.setData({ loginVisible: true });
  },
  closeLogin() {
    this.setData({ loginVisible: false });
  },
  previewManage() {
    this.closeLogin();
  },
  async checkConnection() {
    if (this.data.checking) return;
    this.setData({ checking: true, connection: "正在连接…" });
    try {
      const result = await ping();
      this.setData({ connection: `后端已连接：${result.message}` });
    } catch (error) {
      this.setData({ connection: error instanceof Error ? error.message : "连接失败" });
    } finally {
      this.setData({ checking: false });
    }
  },
});

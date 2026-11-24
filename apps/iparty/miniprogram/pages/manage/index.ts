import { accountPermissions, centerFeaturesFor } from "../../models/account";
import { getRole, getSessionState } from "../../utils/session";
import { restoreEntrySession } from "../../utils/entry-session";
import { errorMessage } from "../../utils/booking-view";

Page({
  data: {
    features: centerFeaturesFor(),
    canCreateShop: false,
    needsLogin: true,
    loading: false,
    error: "",
  },
  onShow() {
    wx.hideShareMenu();
    this.readAccount();
  },
  readAccount() {
    const role = getSessionState() === "valid" ? getRole() : undefined;
    this.setData({
      features: centerFeaturesFor(role),
      canCreateShop: accountPermissions(role).canCreateShop,
      needsLogin: !role,
    });
  },
  async enterCenter() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      if (!(await restoreEntrySession()))
        throw new Error("账号不存在，请返回首页创建店铺，或从公开名片提交预约。");
      this.readAccount();
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  openFeature(event: WechatMiniprogram.TouchEvent) {
    const role = getSessionState() === "valid" ? getRole() : undefined;
    const feature = centerFeaturesFor(role).find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
    if (!feature) {
      this.readAccount();
      return;
    }
    wx.navigateTo({ url: feature.url });
  },
  createShop() {
    if (getSessionState() !== "valid" || !accountPermissions(getRole()).canCreateShop) {
      this.readAccount();
      return;
    }
    wx.navigateTo({ url: "/pages/onboarding/shop/index" });
  },
  home() {
    wx.reLaunch({ url: "/pages/index/index?intro=1" });
  },
});

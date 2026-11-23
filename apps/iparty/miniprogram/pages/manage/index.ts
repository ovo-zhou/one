import { getCurrentAccount } from "../../api/account";
import { ensureWechatLogin } from "../../api/auth";
import { getRole, getToken } from "../../utils/session";
import { errorMessage } from "../../utils/booking-view";

Page({
  data: { role: "", loading: false, error: "" },
  onShow() {
    wx.hideShareMenu();
    const role = getRole() ?? "";
    this.setData({ role });
    if (getToken() && !getRole()) void this.loadRole();
  },
  async loadRole() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      const account = await getCurrentAccount();
      this.setData({ role: account.role });
    } catch (error) {
      this.setData({ role: "", error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  editShop() {
    wx.navigateTo({ url: "/pages/onboarding/shop/index?mode=edit" });
  },
  createShop() {
    wx.navigateTo({ url: "/pages/onboarding/shop/index" });
  },
  openStaff() {
    wx.navigateTo({ url: "/pages/manage/staff/index" });
  },
  openAppointments() {
    wx.navigateTo({ url: "/pages/manage/appointments/index" });
  },
  async openMyBookings() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      await ensureWechatLogin();
      this.setData({ role: getRole() ?? "" });
      await new Promise<void>((resolve, reject) => {
        wx.navigateTo({
          url: "/pages/customer/bookings/index",
          success: () => resolve(),
          fail: () => reject(new Error("进入我的预约失败，请重试")),
        });
      });
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  openAdmin() {
    wx.reLaunch({ url: "/pages/admin/index" });
  },
});

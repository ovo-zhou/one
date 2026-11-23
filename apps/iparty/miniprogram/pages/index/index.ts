import { readDraft } from "../../utils/draft";
import { getRole, getToken } from "../../utils/session";
import { restoreWechatLogin } from "../../api/auth";
import { getCurrentAccount } from "../../api/account";
import { centerPath } from "../../models/account";

Page({
  data: { hasDraft: false, stayHome: false, checking: true, entryError: "", registered: false },
  pageReady: false,
  onLoad(query: Record<string, string | undefined>) {
    this.setData({ stayHome: query.intro === "1" });
  },
  onShow() {
    const draft = readDraft();
    this.setData({ hasDraft: draft.updatedAt > 0 });
    wx.hideShareMenu();
    if (!this.pageReady) return;
    this.enterPage();
  },
  onReady() {
    this.pageReady = true;
    this.enterPage();
  },
  enterPage() {
    if (this.data.stayHome) {
      this.setData({ checking: false, registered: !!getToken() });
      return;
    }
    const hasToken = !!getToken();
    const role = getRole();
    if (hasToken && role) {
      this.openManage();
      return;
    }
    void this.resolveEntry();
  },
  resolvingEntry: false,
  async resolveEntry() {
    if (this.resolvingEntry) return;
    this.resolvingEntry = true;
    this.setData({ checking: true, entryError: "" });
    try {
      const registered = await restoreWechatLogin();
      this.setData({ registered });
      if (registered) {
        if (!getRole()) await getCurrentAccount();
        await new Promise<void>((resolve, reject) => {
          wx.reLaunch({
            url: centerPath(getRole()),
            success: () => resolve(),
            fail: () => reject(new Error("进入我的中心失败，请重试")),
          });
        });
        return;
      }
      this.setData({ checking: false });
    } catch (error) {
      this.setData({
        checking: false,
        entryError: error instanceof Error ? error.message : "无法确认账号状态，请重试",
      });
    } finally {
      this.resolvingEntry = false;
    }
  },
  start() {
    if (this.data.checking || this.data.entryError) return;
    if (this.data.registered) {
      if (getRole()) this.openManage();
      else void this.resolveEntry();
      return;
    }
    wx.navigateTo({ url: "/pages/onboarding/shop/index" });
  },
  openManage() {
    wx.reLaunch({
      url: centerPath(getRole()),
      fail: () => {
        this.setData({ checking: false, entryError: "进入我的中心失败，请重试" });
      },
    });
  },
});

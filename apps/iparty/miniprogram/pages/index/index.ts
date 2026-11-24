import { readDraft } from "../../utils/draft";
import { getSessionState } from "../../utils/session";
import { restoreEntrySession } from "../../utils/entry-session";
import { centerPath } from "../../models/account";

Page({
  data: { hasDraft: false, stayHome: false, entering: false, entryError: "", returning: false },
  pageReady: false,
  navigatingCenter: false,
  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      stayHome: query.intro === "1",
      returning: getSessionState() !== "missing",
    });
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
    const state = getSessionState();
    this.setData({ returning: state !== "missing" });
    if (!this.data.stayHome && state === "valid" && !this.data.entryError && !this.data.entering)
      void this.openManage();
  },
  async start() {
    if (this.data.entering) return;
    const returning = this.data.returning || getSessionState() !== "missing";
    this.setData({ entering: true, entryError: "" });
    try {
      if (await restoreEntrySession()) {
        this.setData({ returning: true });
        await this.navigateToCenter();
      } else if (returning) {
        this.setData({
          returning: false,
          entryError: "原账号不存在，请点击创建我的店铺重新开始。",
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          wx.navigateTo({
            url: "/pages/onboarding/shop/index",
            success: () => resolve(),
            fail: () => reject(new Error("打开创建流程失败，请重试")),
          });
        });
      }
    } catch (error) {
      this.setData({
        entryError: error instanceof Error ? error.message : "无法确认账号状态，请重试",
      });
    } finally {
      this.setData({ entering: false });
    }
  },
  navigateToCenter(): Promise<void> {
    return new Promise((resolve, reject) => {
      wx.reLaunch({
        url: centerPath(),
        success: () => resolve(),
        fail: () => reject(new Error("进入我的中心失败，请重试")),
      });
    });
  },
  async openManage() {
    if (this.data.entering || this.navigatingCenter) return;
    this.navigatingCenter = true;
    try {
      await this.navigateToCenter();
    } catch (error) {
      this.setData({
        entryError: error instanceof Error ? error.message : "进入我的中心失败，请重试",
      });
    } finally {
      this.navigatingCenter = false;
    }
  },
});

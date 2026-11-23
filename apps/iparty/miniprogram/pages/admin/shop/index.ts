import {
  changeShopStatus,
  getAdminShop,
  type AdminShop,
  type AdminStaff,
} from "../../../api/admin";
import { errorMessage } from "../../../utils/booking-view";

Page({
  data: {
    shop: null as AdminShop | null,
    staff: [] as AdminStaff[],
    loading: false,
    saving: false,
    error: "",
    reason: "",
  },
  shopId: "",
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    this.shopId = query.id ?? "";
    void this.load();
  },
  async load() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      this.setData(await getAdminShop(this.shopId));
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  inputReason(event: WechatMiniprogram.Input) {
    if (!this.data.saving) this.setData({ reason: event.detail.value });
  },
  change() {
    if (this.data.saving || this.data.loading || !this.data.shop) return;
    if (!this.data.reason.trim()) {
      this.setData({ error: "请填写本次停用或恢复的原因" });
      return;
    }
    const disabling = this.data.shop.status === "active";
    wx.showModal({
      title: disabling ? "停用这家店铺？" : "恢复这家店铺？",
      content: disabling
        ? "停用后公开名片不可查看，不能新增或确认预约。历史资料和预约不会删除。"
        : "恢复后公开名片和新增预约将重新可用；所属账号禁用时仍不可公开。",
      success: (result) => {
        if (result.confirm) void this.saveStatus();
      },
    });
  },
  async saveStatus() {
    if (this.data.saving || !this.data.shop) return;
    const shop = this.data.shop;
    this.setData({ saving: true, error: "" });
    try {
      await changeShopStatus(
        shop.id,
        shop.status === "active" ? "disabled" : "active",
        this.data.reason.trim(),
        shop.moderationVersion,
      );
      this.setData({ reason: "" });
      await this.load();
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ saving: false });
    }
  },
  audit() {
    wx.navigateTo({ url: `/pages/admin/audit/index?id=${encodeURIComponent(this.shopId)}` });
  },
});

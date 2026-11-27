import {
  changeShopStatus,
  getAdminShop,
  type AdminShop,
  type AdminStaff,
} from "../../../api/admin";
import { errorMessage } from "../../../utils/booking-view";
import { businessHoursRows } from "../../../utils/business-hours";

Page({
  data: {
    shop: null as AdminShop | null,
    staff: [] as AdminStaff[],
    loading: false,
    saving: false,
    loadError: "",
    formError: "",
    reason: "",
    reasonError: "",
    hoursRows: businessHoursRows([]),
  },
  shopId: "",
  validateFields: false,
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    this.shopId = query.id ?? "";
    void this.load();
  },
  async load(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, loadError: "", formError: "" });
    try {
      const result = await getAdminShop(this.shopId, refresh);
      this.setData({ ...result, hoursRows: businessHoursRows(result.shop.businessHours) });
    } catch (error) {
      this.setData({ shop: null, staff: [], hoursRows: [], loadError: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  refresh() {
    if (!this.data.saving) void this.load(true);
  },
  inputReason(event: WechatMiniprogram.Input) {
    if (this.data.saving) return;
    const reason = event.detail.value;
    this.setData({
      reason,
      reasonError: this.validateFields ? this.validateReason(reason) : "",
      formError: "",
    });
  },
  validateReason(value: string): string {
    const reason = value.trim();
    if (!reason) return "请填写本次停用或恢复的原因";
    if (reason.length > 300) return "操作原因最多 300 字";
    return "";
  },
  change() {
    if (this.data.saving || this.data.loading || this.data.loadError || !this.data.shop) return;
    this.validateFields = true;
    const reasonError = this.validateReason(this.data.reason);
    this.setData({ reasonError, formError: "" });
    if (reasonError) return;
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
    this.setData({ saving: true, formError: "" });
    try {
      await changeShopStatus(
        shop.id,
        shop.status === "active" ? "disabled" : "active",
        this.data.reason.trim(),
        shop.moderationVersion,
      );
      this.validateFields = false;
      this.setData({ reason: "", reasonError: "" });
      await this.load();
    } catch (error) {
      this.setData({ formError: errorMessage(error) });
    } finally {
      this.setData({ saving: false });
    }
  },
  audit() {
    wx.navigateTo({ url: `/pages/admin/audit/index?id=${encodeURIComponent(this.shopId)}` });
  },
});

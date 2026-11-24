import { emptyShop, type ShopDraft } from "../../../models/draft";
import { readDraft, saveDraft, shopValidationMessage } from "../../../utils/draft";
import { getMerchantProfile, updateShop } from "../../../api/merchant";

Page({
  data: {
    status: "active",
    statusReason: "",
    form: emptyShop(),
    editing: false,
    saving: false,
    saveError: "",
    loading: false,
    loadError: "",
    choosingLocation: false,
  },
  onLoad(query: Record<string, string | undefined>) {
    const draft = readDraft();
    const editing = query.mode === "edit";
    this.setData({
      form: draft.shop,
      editing,
    });
    wx.setNavigationBarTitle({ title: editing ? "店铺管理" : "创建你的店铺" });
    wx.hideShareMenu();
    if (editing) void this.loadShop();
  },
  async loadShop() {
    if (this.data.loading) return;
    this.setData({ loading: true, loadError: "" });
    try {
      const { profile } = await getMerchantProfile();
      if (!profile) throw new Error("店铺尚未创建，请先完成创建流程");
      this.setData({
        form: profile.shop,
        status: profile.status,
        statusReason: profile.statusReason,
      });
    } catch (error) {
      this.setData({
        loadError: error instanceof Error ? error.message : "店铺资料加载失败，请重试",
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  onFormChange(event: WechatMiniprogram.CustomEvent<{ changes: Partial<ShopDraft> }>) {
    if (this.data.saving || this.data.loading || this.data.loadError) return;
    this.setData({ form: { ...this.data.form, ...event.detail.changes }, saveError: "" });
    this.persist();
  },
  onLocationBusy(event: WechatMiniprogram.CustomEvent<{ busy: boolean }>) {
    this.setData({ choosingLocation: event.detail.busy });
  },
  persist(): boolean {
    // Management loads the current published shop directly. Failed loads or
    // abandoned edits must not replace the initial onboarding draft.
    if (this.data.editing) return true;
    const draft = readDraft();
    return saveDraft({ ...draft, shop: this.data.form });
  },
  onHide() {
    this.persist();
  },
  onUnload() {
    this.persist();
  },
  async next() {
    if (this.data.saving || this.data.loading || this.data.loadError || this.data.choosingLocation)
      return;
    const message = shopValidationMessage(this.data.form);
    if (message) {
      wx.showToast({ title: message, icon: "none" });
      return;
    }
    if (!this.persist()) return;
    if (this.data.editing) {
      this.setData({ saving: true, saveError: "" });
      try {
        await updateShop(this.data.form);
        wx.showToast({ title: "已保存", icon: "success" });
        wx.navigateBack();
      } catch (error) {
        this.setData({
          saveError:
            error instanceof Error ? error.message : "保存失败，请重试，当前填写内容未清除",
        });
      } finally {
        this.setData({ saving: false });
      }
    } else {
      const first = readDraft().staff[0];
      wx.navigateTo({
        url: `/pages/onboarding/staff/index${first ? `?id=${encodeURIComponent(first.id)}` : ""}`,
      });
    }
  },
});

import { emptyShop, type ShopDraft } from "../../../models/draft";
import {
  draftSaveError,
  readDraft,
  saveDraft,
  shopFieldErrors,
  type ShopFieldErrors,
} from "../../../utils/draft";
import { getMerchantProfile, updateShop } from "../../../api/merchant";

Page({
  data: {
    status: "active",
    statusReason: "",
    form: emptyShop(),
    fieldErrors: {} as ShopFieldErrors,
    editing: false,
    saving: false,
    saveError: "",
    loading: false,
    loadError: "",
    choosingLocation: false,
  },
  validateFields: false,
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
  retry() {
    void this.loadShop(true);
  },
  async loadShop(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, loadError: "" });
    try {
      const { profile } = await getMerchantProfile(refresh);
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
    const form = { ...this.data.form, ...event.detail.changes };
    this.setData({
      form,
      fieldErrors: this.validateFields ? shopFieldErrors(form) : {},
      saveError: "",
    });
    if (!this.persist()) this.setData({ saveError: draftSaveError });
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
    this.validateFields = true;
    const fieldErrors = shopFieldErrors(this.data.form);
    this.setData({ fieldErrors, saveError: "" });
    if (Object.keys(fieldErrors).length) return;
    if (!this.persist()) {
      this.setData({ saveError: draftSaveError });
      return;
    }
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

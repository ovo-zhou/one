import { emptyShop, industries, type ShopDraft } from "../../../models/draft";
import { readDraft, saveDraft, shopValidationMessage } from "../../../utils/draft";

Page({
  data: { form: emptyShop(), industries, industryIndex: 0, editing: false },
  onLoad(query: Record<string, string | undefined>) {
    const draft = readDraft();
    const editing = query.mode === "edit";
    this.setData({
      form: draft.shop,
      industryIndex: Math.max(0, industries.indexOf(draft.shop.industry)),
      editing,
    });
    wx.setNavigationBarTitle({ title: editing ? "店铺管理" : "创建你的店铺" });
    wx.hideShareMenu();
  },
  onInput(event: WechatMiniprogram.Input) {
    const field = event.currentTarget.dataset.field as keyof ShopDraft;
    if (!(field in this.data.form)) return;
    this.setData({ [`form.${field}`]: event.detail.value });
    this.persist();
  },
  onIndustry(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value);
    this.setData({ industryIndex: index, "form.industry": industries[index] ?? industries[0] });
    this.persist();
  },
  persist(): boolean {
    const draft = readDraft();
    return saveDraft({ ...draft, shop: this.data.form });
  },
  onHide() {
    this.persist();
  },
  onUnload() {
    this.persist();
  },
  next() {
    const message = shopValidationMessage(this.data.form);
    if (message) {
      wx.showToast({ title: message, icon: "none" });
      return;
    }
    if (!this.persist()) return;
    if (this.data.editing) {
      wx.showToast({ title: "已保存到本地", icon: "success" });
      wx.navigateBack();
    } else {
      const first = readDraft().staff[0];
      wx.navigateTo({
        url: `/pages/onboarding/staff/index${first ? `?id=${encodeURIComponent(first.id)}` : ""}`,
      });
    }
  },
});

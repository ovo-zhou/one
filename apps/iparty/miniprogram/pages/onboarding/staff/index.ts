import { emptyStaff, type StaffDraft } from "../../../models/draft";
import { isDraftReady, readDraft, saveDraft, staffValidationMessage } from "../../../utils/draft";

Page({
  data: { form: emptyStaff(), editing: false, loginVisible: false, invalid: false },
  onLoad(query: Record<string, string | undefined>) {
    const draft = readDraft();
    const existing = query.id ? draft.staff.find((staff) => staff.id === query.id) : undefined;
    this.setData({ editing: query.mode === "edit" });
    wx.hideShareMenu();
    if (query.id && !existing) {
      this.setData({ invalid: true });
      return;
    }
    this.setData({
      form: existing ?? {
        ...emptyStaff(),
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    });
  },
  onInput(event: WechatMiniprogram.Input) {
    const field = event.currentTarget.dataset.field as keyof StaffDraft;
    if (field === "id" || !(field in this.data.form)) return;
    this.setData({ [`form.${field}`]: event.detail.value });
    this.persist();
  },
  persist(): boolean {
    if (this.data.invalid) return false;
    const draft = readDraft();
    const form = this.data.form;
    const exists = draft.staff.some((staff) => staff.id === form.id);
    if (!exists && !form.name && !form.title && !form.skills && !form.description) return true;
    const staff = exists
      ? draft.staff.map((staff) => (staff.id === form.id ? form : staff))
      : [...draft.staff, form];
    return saveDraft({ ...draft, staff });
  },
  onHide() {
    this.persist();
  },
  onUnload() {
    this.persist();
  },
  finish() {
    const message = staffValidationMessage(this.data.form);
    if (message) {
      wx.showToast({ title: message, icon: "none" });
      return;
    }
    if (!this.persist()) return;
    if (this.data.editing) {
      wx.navigateBack();
      return;
    }
    if (!isDraftReady(readDraft())) {
      wx.showModal({
        title: "资料还未完善",
        content: "请检查店铺资料和人员必填信息，可以在管理预览中继续编辑。",
        showCancel: false,
      });
      return;
    }
    this.setData({ loginVisible: true });
  },
  closeLogin() {
    this.setData({ loginVisible: false });
  },
  previewManage() {
    wx.reLaunch({ url: "/pages/manage/index" });
  },
});

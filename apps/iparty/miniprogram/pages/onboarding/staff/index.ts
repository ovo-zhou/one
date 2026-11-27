import { emptyStaff, type StaffDraft } from "../../../models/draft";
import {
  draftSaveError,
  isDraftReady,
  readDraft,
  saveDraft,
  staffFieldErrors,
  type StaffFieldErrors,
} from "../../../utils/draft";
import { publishMyShop } from "../../../utils/publish";
import { getMerchantProfile, saveStaff } from "../../../api/merchant";

Page({
  data: {
    form: emptyStaff(),
    fieldErrors: {} as StaffFieldErrors,
    editing: false,
    existing: false,
    publishing: false,
    publishError: "",
    invalid: false,
    loading: false,
    loadError: "",
  },
  validateFields: false,
  personId: "",
  onLoad(query: Record<string, string | undefined>) {
    const draft = readDraft();
    const editing = query.mode === "edit";
    this.personId = query.id ?? "";
    const existing =
      !editing && query.id ? draft.staff.find((staff) => staff.id === query.id) : undefined;
    this.setData({ editing, existing: editing ? !!query.id : !!existing });
    wx.setNavigationBarTitle({
      title: editing ? (query.id ? "编辑服务人员" : "添加服务人员") : "服务人员资料",
    });
    wx.hideShareMenu();
    if (editing && query.id) {
      void this.loadPerson();
      return;
    }
    if (!editing && query.id && !existing) {
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
  retry() {
    void this.loadPerson(true);
  },
  async loadPerson(refresh = false) {
    this.setData({ loading: true, loadError: "" });
    try {
      const { profile } = await getMerchantProfile(refresh);
      const person = profile?.staff.find((person) => person.id === this.personId);
      if (!person) {
        this.setData({ invalid: true });
        return;
      }
      const { id, name, title, skills, description } = person;
      this.setData({ form: { id, name, title, skills, description } });
    } catch (error) {
      this.setData({
        loadError: error instanceof Error ? error.message : "人员资料加载失败，请重试",
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  onFormChange(event: WechatMiniprogram.CustomEvent<{ field: keyof StaffDraft; value: string }>) {
    if (this.data.publishing || this.data.loading || this.data.loadError) return;
    const { field, value } = event.detail;
    if (field === "id" || !(field in this.data.form)) return;
    const form = { ...this.data.form, [field]: value };
    this.setData({
      form,
      fieldErrors: this.validateFields ? staffFieldErrors(form) : {},
      publishError: "",
    });
    if (!this.persist()) this.setData({ publishError: draftSaveError });
  },
  persist(): boolean {
    if (this.data.invalid) return false;
    // Only the initial onboarding flow has a local draft. Management edits stay
    // inside this page until the server confirms a direct publication.
    if (this.data.editing) return true;
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
  async finish() {
    if (this.data.publishing || this.data.loading || this.data.loadError || this.data.invalid)
      return;
    this.validateFields = true;
    const fieldErrors = staffFieldErrors(this.data.form);
    this.setData({ fieldErrors, publishError: "" });
    if (Object.keys(fieldErrors).length) return;
    if (!this.persist()) {
      this.setData({ publishError: draftSaveError });
      return;
    }
    if (!this.data.editing && !isDraftReady(readDraft())) {
      this.setData({ publishError: "资料还未完善，请检查店铺资料和人员必填信息。" });
      return;
    }
    this.setData({ publishing: true, publishError: "" });
    try {
      if (this.data.editing) {
        await saveStaff(this.data.form);
        wx.showToast({ title: "已保存并发布", icon: "success" });
        await new Promise<void>((resolve, reject) => {
          wx.navigateBack({
            success: () => resolve(),
            fail: () => reject(new Error("人员已保存，返回列表失败，请重试")),
          });
        });
        return;
      }
      await publishMyShop();
      await new Promise<void>((resolve, reject) => {
        wx.reLaunch({
          url: "/pages/manage/index",
          success: () => resolve(),
          fail: () => reject(new Error("店铺已保存，进入店铺管理失败，请重试")),
        });
      });
    } catch (error) {
      this.setData({
        publishError:
          error instanceof Error ? error.message : "保存失败，请重试，当前填写内容未清除",
      });
    } finally {
      this.setData({ publishing: false });
    }
  },
  preview() {
    if (!this.persist()) {
      this.setData({ publishError: draftSaveError });
      return;
    }
    wx.navigateTo({
      url: `/pages/staff/detail/index?mode=local&id=${encodeURIComponent(this.data.form.id)}`,
    });
  },
});

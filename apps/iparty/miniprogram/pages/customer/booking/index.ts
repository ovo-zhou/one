import { ensureWechatLogin } from "../../../api/auth";
import { createBooking } from "../../../api/bookings";
import { getPublicStaff } from "../../../api/merchant";
import { emptyShop, emptyStaff } from "../../../models/draft";
import { errorMessage } from "../../../utils/booking-view";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 3) | 8).toString(16);
  });
}

Page({
  data: {
    shop: emptyShop(),
    staff: emptyStaff(),
    contactName: "",
    contactPhone: "",
    date: "",
    time: "",
    note: "",
    consent: false,
    loading: true,
    loadError: "",
    saving: false,
    error: "",
    submittedId: "",
  },
  staffId: "",
  requestKey: "",
  submittedPayload: "",
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    this.staffId = query.id ?? "";
    void this.load();
  },
  async load() {
    this.setData({ loading: true, loadError: "" });
    try {
      this.setData(await getPublicStaff(this.staffId));
    } catch (error) {
      this.setData({ loadError: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  input(event: WechatMiniprogram.Input) {
    if (this.data.saving || this.data.submittedId) return;
    const field = String(event.currentTarget.dataset.field);
    if (["contactName", "contactPhone", "note"].includes(field))
      this.setData({ [field]: event.detail.value, error: "" });
  },
  chooseDate(event: WechatMiniprogram.PickerChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.setData({ date: String(event.detail.value), error: "" });
  },
  chooseTime(event: WechatMiniprogram.PickerChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.setData({ time: String(event.detail.value), error: "" });
  },
  consentChange(event: WechatMiniprogram.CheckboxGroupChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.setData({ consent: event.detail.value.includes("agree"), error: "" });
  },
  async submit() {
    if (this.data.saving || this.data.loading || this.data.loadError) return;
    if (this.data.submittedId) {
      this.openResult();
      return;
    }
    const { date, time, note } = this.data;
    const contactName = this.data.contactName.trim();
    const contactPhone = this.data.contactPhone.trim();
    const requestedAt = date && time ? new Date(`${date}T${time}:00+08:00`).getTime() : NaN;
    const now = Date.now();
    let validationError = "";
    if (!contactName) validationError = "请填写联系人姓名";
    else if (!/^[0-9+()\-\s]{7,25}$/.test(contactPhone))
      validationError = "请填写有效的联系电话（7–25 位）";
    else if (!date) validationError = "请选择意向日期";
    else if (!time) validationError = "请选择意向时间";
    else if (!Number.isFinite(requestedAt)) validationError = "意向时间无效，请重新选择";
    else if (requestedAt <= now) validationError = "请选择晚于当前时间的意向时间（中国标准时间）";
    else if (requestedAt > now + 90 * 86_400_000) validationError = "请选择未来 90 天内的意向时间";
    else if (!this.data.consent) validationError = "请先勾选同意将本次预约信息提供给商家";
    if (validationError) {
      this.setData({ error: validationError });
      return;
    }
    const payload = {
      staffId: this.staffId,
      contactName,
      contactPhone,
      requestedAt,
      note: note.trim(),
    };
    const serialized = JSON.stringify(payload);
    if (serialized !== this.submittedPayload) {
      this.requestKey = uuid();
      this.submittedPayload = serialized;
    }
    this.setData({ saving: true, error: "" });
    try {
      await ensureWechatLogin();
      const { id } = await createBooking({
        ...payload,
        requestKey: this.requestKey,
        consent: true,
      });
      this.setData({ submittedId: id });
      this.openResult();
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ saving: false });
    }
  },
  openResult() {
    wx.redirectTo({
      url: "/pages/manage/index",
      fail: () => {
        this.setData({ error: "预约已提交，进入我的中心失败，可点击下方按钮重试。" });
      },
    });
  },
});

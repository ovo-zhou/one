import { ensureWechatLogin } from "../../../api/auth";
import { createBooking } from "../../../api/bookings";
import { getPublicStaff } from "../../../api/merchant";
import { emptyShop, emptyStaff } from "../../../models/draft";
import { errorMessage } from "../../../utils/booking-view";

type BookingFields = {
  contactName: string;
  contactPhone: string;
  date: string;
  time: string;
  note: string;
  consent: boolean;
};

type BookingFieldErrors = Partial<Record<keyof BookingFields, string>>;

function validateBooking(values: BookingFields) {
  const { date, time, consent } = values;
  const contactName = values.contactName.trim();
  const contactPhone = values.contactPhone.trim();
  const note = values.note.trim();
  const requestedAt = date && time ? new Date(`${date}T${time}:00+08:00`).getTime() : NaN;
  const now = Date.now();
  const fieldErrors: BookingFieldErrors = {};
  if (!contactName) fieldErrors.contactName = "请填写联系人姓名";
  else if (contactName.length > 40) fieldErrors.contactName = "联系人姓名最多 40 字";
  if (!/^[0-9+()\-\s]{7,25}$/.test(contactPhone))
    fieldErrors.contactPhone = "请填写有效的联系电话（7–25 位）";
  if (!date) fieldErrors.date = "请选择意向日期";
  if (!time) fieldErrors.time = "请选择意向时间";
  else if (date) {
    if (!Number.isFinite(requestedAt)) fieldErrors.time = "意向时间无效，请重新选择";
    else if (requestedAt <= now)
      fieldErrors.time = "请选择晚于当前时间的意向时间（中国标准时间）";
    else if (requestedAt > now + 90 * 86_400_000)
      fieldErrors.time = "请选择未来 90 天内的意向时间";
  }
  if (note.length > 500) fieldErrors.note = "备注最多 500 字";
  if (!consent) fieldErrors.consent = "请先勾选同意将本次预约信息提供给商家";
  return { fieldErrors, contactName, contactPhone, requestedAt, note };
}

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
    fieldErrors: {} as BookingFieldErrors,
    error: "",
    submittedId: "",
  },
  staffId: "",
  requestKey: "",
  submittedPayload: "",
  validateFields: false,
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
    const field = event.currentTarget.dataset.field;
    if (field === "contactName" || field === "contactPhone" || field === "note")
      this.updateFields({ [field]: event.detail.value });
  },
  chooseDate(event: WechatMiniprogram.PickerChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.updateFields({ date: String(event.detail.value) });
  },
  chooseTime(event: WechatMiniprogram.PickerChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.updateFields({ time: String(event.detail.value) });
  },
  consentChange(event: WechatMiniprogram.CheckboxGroupChange) {
    if (!this.data.saving && !this.data.submittedId)
      this.updateFields({ consent: event.detail.value.includes("agree") });
  },
  updateFields(changes: Partial<BookingFields>) {
    const fieldErrors = this.validateFields
      ? validateBooking({ ...this.data, ...changes }).fieldErrors
      : {};
    this.setData({ ...changes, fieldErrors, error: "" });
  },
  async submit() {
    if (this.data.saving || this.data.loading || this.data.loadError) return;
    if (this.data.submittedId) {
      this.openResult();
      return;
    }
    this.validateFields = true;
    const { fieldErrors, contactName, contactPhone, requestedAt, note } = validateBooking(this.data);
    this.setData({ fieldErrors, error: "" });
    if (Object.keys(fieldErrors).length) return;
    const payload = {
      staffId: this.staffId,
      contactName,
      contactPhone,
      requestedAt,
      note,
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

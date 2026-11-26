import { emptyShop, type ShopDraft } from "../../models/draft";
import { hasShopLocation } from "../../utils/shop-location";
import { businessHoursMessage, businessHoursRows, weekdays } from "../../utils/business-hours";

Component({
  options: { styleIsolation: "apply-shared" },
  properties: {
    form: { type: Object, value: emptyShop() },
    disabled: { type: Boolean, value: false },
  },
  data: {
    locating: false,
    showPrivacy: false,
    privacyContractName: "",
    locationError: "",
    hasLocation: false,
    hoursRows: businessHoursRows([]),
    canAddHours: true,
    hoursEditing: false,
    hoursIndex: -1,
    hoursDays: [] as number[],
    hoursStart: "",
    hoursEnd: "",
    hoursError: "",
    weekOptions: weekdays.map((label, index) => ({
      label,
      day: index + 1,
      selected: false,
      unavailable: false,
    })),
  },
  observers: {
    form(form: ShopDraft) {
      this.setData({
        hasLocation: hasShopLocation(form),
        hoursRows: businessHoursRows(form.businessHours),
        canAddHours: form.businessHours.reduce((count, group) => count + group.days.length, 0) < 7,
      });
    },
    "locating, showPrivacy, hoursEditing"(
      locating: boolean,
      showPrivacy: boolean,
      hoursEditing: boolean,
    ) {
      this.triggerEvent("busy", { busy: locating || showPrivacy || hoursEditing });
    },
  },
  methods: {
    preventHoursBubble() {},
    onInput(event: WechatMiniprogram.Input) {
      if (this.data.disabled || this.data.locating || this.data.showPrivacy) return;
      const field = event.currentTarget.dataset.field as keyof ShopDraft;
      if (!["name", "description", "addressDetail", "wechat", "qq", "phone"].includes(field))
        return;
      const changes: Partial<ShopDraft> = { [field]: event.detail.value };
      this.triggerEvent("change", { changes });
    },
    openHours(event: WechatMiniprogram.TouchEvent) {
      if (
        this.data.disabled ||
        this.data.locating ||
        this.data.showPrivacy ||
        this.data.hoursEditing
      )
        return;
      const index =
        event.currentTarget.dataset.index === undefined
          ? -1
          : Number(event.currentTarget.dataset.index);
      const hours = (this.data.form as ShopDraft).businessHours;
      const group = hours[index];
      const used = new Set(hours.filter((_, i) => i !== index).flatMap((item) => item.days));
      this.setData({
        hoursEditing: true,
        hoursIndex: index,
        hoursDays: group ? [...group.days] : [],
        hoursStart: group?.start ?? "10:00",
        hoursEnd: group?.end ?? "21:00",
        hoursError: "",
        weekOptions: weekdays.map((label, i) => ({
          label,
          day: i + 1,
          selected: group?.days.includes(i + 1) ?? false,
          unavailable: used.has(i + 1),
        })),
      });
    },
    toggleHoursDay(event: WechatMiniprogram.TouchEvent) {
      if (this.data.disabled) return;
      const day = Number(event.currentTarget.dataset.day);
      const option = this.data.weekOptions.find((item) => item.day === day);
      if (!option || option.unavailable) return;
      const days = this.data.hoursDays.includes(day)
        ? this.data.hoursDays.filter((item) => item !== day)
        : [...this.data.hoursDays, day].sort((a, b) => a - b);
      this.setData({
        hoursDays: days,
        hoursError: "",
        weekOptions: this.data.weekOptions.map((item) => ({
          ...item,
          selected: days.includes(item.day),
        })),
      });
    },
    changeHoursTime(event: WechatMiniprogram.PickerChange) {
      if (this.data.disabled) return;
      const field = event.currentTarget.dataset.field;
      if (field === "hoursStart" || field === "hoursEnd")
        this.setData({ [field]: String(event.detail.value), hoursError: "" });
    },
    saveHours() {
      if (this.data.disabled) return;
      const hours = [...(this.data.form as ShopDraft).businessHours];
      const group = {
        days: [...this.data.hoursDays],
        start: this.data.hoursStart,
        end: this.data.hoursEnd,
      };
      if (this.data.hoursIndex < 0) hours.push(group);
      else hours[this.data.hoursIndex] = group;
      const message = businessHoursMessage(hours);
      if (message) {
        this.setData({ hoursError: message });
        return;
      }
      this.triggerEvent("change", { changes: { businessHours: hours, legacyBusinessHours: "" } });
      this.setData({ hoursEditing: false, hoursError: "" });
    },
    cancelHours() {
      if (!this.data.disabled) this.setData({ hoursEditing: false, hoursError: "" });
    },
    deleteHours(event: WechatMiniprogram.TouchEvent) {
      if (this.data.disabled || this.data.hoursEditing) return;
      const index = Number(event.currentTarget.dataset.index);
      this.triggerEvent("change", {
        changes: {
          businessHours: (this.data.form as ShopDraft).businessHours.filter((_, i) => i !== index),
        },
      });
    },
    clearLegacyHours() {
      if (this.data.disabled || this.data.hoursEditing) return;
      this.triggerEvent("change", { changes: { legacyBusinessHours: "" } });
    },
    chooseLocation() {
      if (
        this.data.disabled ||
        this.data.locating ||
        this.data.showPrivacy ||
        this.data.hoursEditing
      )
        return;
      this.setData({ locating: true, locationError: "" });
      if (typeof wx.getPrivacySetting !== "function") {
        this.openLocationPicker();
        return;
      }
      wx.getPrivacySetting({
        success: (result) => {
          if (result.needAuthorization) {
            this.setData({
              locating: false,
              showPrivacy: true,
              privacyContractName: result.privacyContractName,
            });
          } else this.openLocationPicker();
        },
        fail: () =>
          this.setData({
            locating: false,
            locationError: "无法读取隐私授权状态，请重试。",
          }),
      });
    },
    openPrivacyContract() {
      wx.openPrivacyContract({
        fail: () => this.setData({ locationError: "隐私保护指引暂时无法打开，请重试。" }),
      });
    },
    agreePrivacy() {
      this.setData({ showPrivacy: false });
      if (this.data.disabled || this.data.locating) return;
      this.setData({ locating: true, locationError: "" });
      this.openLocationPicker();
    },
    cancelPrivacy() {
      this.setData({
        showPrivacy: false,
        locationError: "未开启地图选址，保存门店前需要同意并选择位置。",
      });
    },
    openLocationPicker() {
      const form = this.data.form as ShopDraft;
      wx.chooseLocation({
        ...(hasShopLocation(form) ? { latitude: form.latitude!, longitude: form.longitude! } : {}),
        success: (location) => {
          if (this.data.disabled) return;
          if (
            !hasShopLocation(location) ||
            !location.name.trim() ||
            !location.address.trim() ||
            location.address.length > 200 ||
            location.name.length > 100
          ) {
            this.setData({
              locationError: "选择的位置资料不完整或过长，请重新选择。",
            });
            return;
          }
          const changed =
            form.latitude !== location.latitude ||
            form.longitude !== location.longitude ||
            form.address !== location.address;
          this.triggerEvent("change", {
            changes: {
              address: location.address,
              locationName: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
              addressDetail: changed ? "" : form.addressDetail,
            },
          });
        },
        fail: (error) => {
          if (/cancel/i.test(error.errMsg)) return;
          const denied = /auth|permission|deny/i.test(error.errMsg);
          this.setData({
            locationError: denied
              ? "位置授权未开启，请在微信的小程序设置中允许位置权限后重试。"
              : "地图选址暂不可用，请稍后重试。",
          });
        },
        complete: () => this.setData({ locating: false }),
      });
    },
  },
});

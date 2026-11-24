import { emptyShop, type ShopDraft } from "../../models/draft";
import { hasShopLocation } from "../../utils/shop-location";

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
  },
  observers: {
    form(form: ShopDraft) {
      this.setData({ hasLocation: hasShopLocation(form) });
    },
    "locating, showPrivacy"(locating: boolean, showPrivacy: boolean) {
      this.triggerEvent("busy", { busy: locating || showPrivacy });
    },
  },
  methods: {
    onInput(event: WechatMiniprogram.Input) {
      if (this.data.disabled || this.data.locating || this.data.showPrivacy) return;
      const field = event.currentTarget.dataset.field as keyof ShopDraft;
      if (!["name", "description", "addressDetail", "phone", "businessHours"].includes(field))
        return;
      const changes: Partial<ShopDraft> = { [field]: event.detail.value };
      this.triggerEvent("change", { changes });
    },
    chooseLocation() {
      if (this.data.disabled || this.data.locating || this.data.showPrivacy) return;
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

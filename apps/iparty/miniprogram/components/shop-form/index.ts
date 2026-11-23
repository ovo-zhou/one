import { emptyShop, type ShopDraft } from "../../models/draft";

Component({
  options: { styleIsolation: "apply-shared" },
  properties: {
    form: { type: Object, value: emptyShop() },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onInput(event: WechatMiniprogram.Input) {
      if (this.data.disabled) return;
      const field = event.currentTarget.dataset.field as keyof ShopDraft;
      if (!(field in emptyShop())) return;
      this.triggerEvent("change", { field, value: event.detail.value });
    },
  },
});

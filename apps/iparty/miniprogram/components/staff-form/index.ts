import { emptyStaff, type StaffDraft } from "../../models/draft";
import type { StaffFieldErrors } from "../../utils/draft";

Component({
  options: { styleIsolation: "apply-shared" },
  properties: {
    form: { type: Object, value: emptyStaff() },
    errors: { type: Object, value: {} as StaffFieldErrors },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onInput(event: WechatMiniprogram.Input) {
      if (this.data.disabled) return;
      const field = event.currentTarget.dataset.field as keyof StaffDraft;
      if (field === "id" || !(field in emptyStaff())) return;
      this.triggerEvent("change", { field, value: event.detail.value });
    },
  },
});

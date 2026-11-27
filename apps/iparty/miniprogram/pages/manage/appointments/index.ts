import { listBookings, setBookingStatus, type Cursor } from "../../../api/bookings";
import { bookingView, errorMessage } from "../../../utils/booking-view";

Page({
  data: {
    items: [] as ReturnType<typeof bookingView>[],
    loading: false,
    saving: false,
    error: "",
    hasMore: false,
  },
  cursor: null as Cursor,
  onShow() {
    wx.hideShareMenu();
    void this.load(true);
  },
  async load(reset: boolean, refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      const result = await listBookings(true, reset ? null : this.cursor, refresh);
      this.cursor = result.next;
      this.setData({
        items: reset
          ? result.items.map(bookingView)
          : [...this.data.items, ...result.items.map(bookingView)],
        hasMore: !!result.next,
      });
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  retry() {
    void this.load(true, true);
  },
  async onPullDownRefresh() {
    try {
      if (!this.data.saving) await this.load(true, true);
    } finally {
      wx.stopPullDownRefresh();
    }
  },
  more() {
    if (this.data.hasMore) void this.load(false);
  },
  onReachBottom() {
    this.more();
  },
  change(event: WechatMiniprogram.TouchEvent) {
    if (this.data.saving || this.data.loading) return;
    const id = String(event.currentTarget.dataset.id);
    const status = String(event.currentTarget.dataset.status);
    if (status !== "confirmed" && status !== "rejected" && status !== "completed") return;
    const label =
      status === "confirmed" ? "确认预约" : status === "rejected" ? "拒绝预约" : "标记已完成";
    wx.showModal({
      title: `${label}？`,
      content:
        status === "confirmed"
          ? "请先与客户核实时间，确认不会自动检查人员档期。"
          : "此操作会更新客户看到的预约状态。",
      success: (result) => {
        if (result.confirm) void this.saveStatus(id, status);
      },
    });
  },
  async saveStatus(id: string, status: "confirmed" | "rejected" | "completed") {
    if (this.data.saving) return;
    this.setData({ saving: true, error: "" });
    try {
      await setBookingStatus(id, status);
      await this.load(true);
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ saving: false });
    }
  },
  call(event: WechatMiniprogram.TouchEvent) {
    const item = this.data.items.find((item) => item.id === event.currentTarget.dataset.id);
    if (item) wx.makePhoneCall({ phoneNumber: item.contactPhone });
  },
});

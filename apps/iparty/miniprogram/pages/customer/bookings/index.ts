import { listBookings, type Cursor } from "../../../api/bookings";
import { bookingView, errorMessage } from "../../../utils/booking-view";

Page({
  data: {
    items: [] as ReturnType<typeof bookingView>[],
    loading: false,
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
      const result = await listBookings(false, reset ? null : this.cursor, refresh);
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
      await this.load(true, true);
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
  detail(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({
      url: `/pages/customer/booking-detail/index?id=${encodeURIComponent(String(event.currentTarget.dataset.id))}`,
    });
  },
});

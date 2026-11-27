import { listAudit, type AuditLog } from "../../../api/admin";
import type { Cursor } from "../../../api/bookings";
import { errorMessage, formatTime } from "../../../utils/booking-view";

Page({
  data: {
    items: [] as (AuditLog & { timeLabel: string })[],
    loading: false,
    error: "",
    hasMore: false,
  },
  shopId: "",
  cursor: null as Cursor,
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    this.shopId = query.id ?? "";
    void this.load(true);
  },
  async load(reset: boolean, refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      const result = await listAudit(this.shopId, reset ? null : this.cursor, refresh);
      this.cursor = result.next;
      const items = result.items.map((item) => ({
        ...item,
        timeLabel: formatTime(item.createdAt),
      }));
      this.setData({
        items: reset ? items : [...this.data.items, ...items],
        hasMore: !!result.next,
      });
    } catch (error) {
      this.cursor = null;
      this.setData({ items: [], hasMore: false, error: errorMessage(error) });
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
});

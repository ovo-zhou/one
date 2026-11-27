import { listShops, type ShopSummary } from "../../api/admin";
import type { Cursor } from "../../api/bookings";
import { errorMessage, formatTime } from "../../utils/booking-view";
import { requireRole } from "../../utils/role-guard";

Page({
  data: {
    items: [] as (ShopSummary & { createdLabel: string; updatedLabel: string })[],
    q: "",
    filterIndex: 0,
    filters: ["全部店铺", "正常店铺", "已停用店铺"],
    loading: false,
    error: "",
    hasMore: false,
  },
  cursor: null as Cursor,
  search: "",
  status: "",
  onShow() {
    wx.hideShareMenu();
    void this.load(true);
  },
  input(event: WechatMiniprogram.Input) {
    this.setData({ q: event.detail.value });
  },
  filter(event: WechatMiniprogram.PickerChange) {
    if (!this.data.loading) {
      this.setData({ filterIndex: Number(event.detail.value) });
      this.searchShops();
    }
  },
  searchShops() {
    if (this.data.loading) return;
    this.search = this.data.q.trim();
    this.status = ["", "active", "disabled"][this.data.filterIndex] ?? "";
    void this.load(true);
  },
  async load(reset: boolean, refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      if (!(await requireRole("super_admin"))) return;
      const result = await listShops(this.search, this.status, reset ? null : this.cursor, refresh);
      this.cursor = result.next;
      const items = result.items.map((item) => ({
        ...item,
        createdLabel: formatTime(item.createdAt),
        updatedLabel: formatTime(item.updatedAt),
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
  detail(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({
      url: `/pages/admin/shop/index?id=${encodeURIComponent(String(event.currentTarget.dataset.id))}`,
    });
  },
});

import { cancelBooking, getBooking } from "../../../api/bookings";
import { bookingView, errorMessage } from "../../../utils/booking-view";

Page({
  data: {
    booking: null as ReturnType<typeof bookingView> | null,
    loading: false,
    saving: false,
    error: "",
  },
  bookingId: "",
  onLoad(query: Record<string, string | undefined>) {
    wx.hideShareMenu();
    this.bookingId = query.id ?? "";
    void this.load();
  },
  async load() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: "" });
    try {
      const { booking } = await getBooking(this.bookingId);
      this.setData({ booking: bookingView(booking) });
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ loading: false });
    }
  },
  cancel() {
    if (this.data.saving) return;
    wx.showModal({
      title: "取消预约？",
      content: "取消后若需预约，请重新提交。",
      success: (result) => {
        if (result.confirm) void this.confirmCancel();
      },
    });
  },
  async confirmCancel() {
    if (this.data.saving) return;
    this.setData({ saving: true, error: "" });
    try {
      await cancelBooking(this.bookingId);
      await this.load();
    } catch (error) {
      this.setData({ error: errorMessage(error) });
    } finally {
      this.setData({ saving: false });
    }
  },
  contact() {
    if (this.data.booking) wx.makePhoneCall({ phoneNumber: this.data.booking.shopPhone });
  },
});

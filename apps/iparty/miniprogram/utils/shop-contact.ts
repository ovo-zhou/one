export type ShopContacts = { wechat: string; qq: string; phone: string };
type ContactChannel = keyof ShopContacts;

const channels: { key: ContactChannel; label: string; action: string }[] = [
  { key: "wechat", label: "微信", action: "复制微信号" },
  { key: "qq", label: "QQ", action: "复制 QQ 号" },
  { key: "phone", label: "电话", action: "拨打电话" },
];

export function shopContacts(shop: ShopContacts) {
  return channels
    .map((channel) => ({ ...channel, value: shop[channel.key].trim() }))
    .filter((channel) => Boolean(channel.value));
}

export function contactShop(shop: ShopContacts, channel?: string) {
  const contacts = shopContacts(shop);
  const act = (contact: (typeof contacts)[number]) => {
    if (contact.key === "phone") {
      wx.makePhoneCall({
        phoneNumber: contact.value,
        fail: (error) => {
          if (!/cancel/i.test(error.errMsg))
            wx.showToast({ title: "暂时无法拨号，请重试", icon: "none" });
        },
      });
    } else {
      wx.setClipboardData({
        data: contact.value,
        fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" }),
      });
    }
  };
  if (channel) {
    const contact = contacts.find((item) => item.key === channel);
    if (contact) act(contact);
    return;
  }
  if (contacts.length === 1) {
    act(contacts[0]!);
  } else if (contacts.length > 1) {
    wx.showActionSheet({
      itemList: contacts.map((item) => `${item.action}：${item.value}`),
      success: (result) => {
        const contact = contacts[result.tapIndex];
        if (contact) act(contact);
      },
    });
  } else {
    wx.showToast({ title: "商家暂未提供联系方式", icon: "none" });
  }
}

import { getCurrentAccount } from "../api/account";
import { centerPath, type Role } from "../models/account";
import { getRole } from "./session";

export async function requireRole(role: Role): Promise<boolean> {
  const actual = getRole() ?? (await getCurrentAccount()).role;
  if (actual === role) return true;
  wx.showToast({ title: "当前账号无此权限", icon: "none" });
  wx.reLaunch({ url: centerPath(actual) });
  return false;
}

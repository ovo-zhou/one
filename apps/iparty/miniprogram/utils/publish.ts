import { ensureWechatLogin } from "../api/auth";
import { publishProfile } from "../api/merchant";
import { isDraftReady, readDraft } from "./draft";
import { getRole, updateRole } from "./session";

export async function publishMyShop(): Promise<void> {
  const draft = readDraft();
  if (!isDraftReady(draft)) throw new Error("请先完善店铺及至少一位人员资料");
  await ensureWechatLogin();
  await publishProfile(draft);
  if (getRole() === "customer") updateRole("merchant");
}

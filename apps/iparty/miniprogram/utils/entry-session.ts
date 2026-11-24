import { getCurrentAccount } from "../api/account";
import { restoreWechatLogin } from "../api/auth";
import { clearSession, getSessionState } from "./session";

// Called by explicit entry actions only, never by page lifecycle hooks.
export async function restoreEntrySession(): Promise<boolean> {
  if (!(await restoreWechatLogin())) {
    clearSession();
    return false;
  }
  if (getSessionState() !== "valid") await getCurrentAccount();
  return true;
}

import { getApiBaseUrl } from "../config/api";
import { isRole, type Account, type Role } from "../models/account";

type Session = { token: string; expiresAt: number; user: Account };
export type SessionState = "missing" | "expired" | "incomplete" | "valid";

function storageKey(): string {
  return `iparty:session:${getApiBaseUrl()}`;
}

// Expired credentials are only a UI hint, never authentication or authorization.
export function getSessionState(): SessionState {
  const value: unknown = wx.getStorageSync(storageKey());
  if (typeof value !== "object" || value === null) return "missing";
  const session = value as Partial<Session>;
  if (
    typeof session.token !== "string" ||
    !session.token ||
    typeof session.expiresAt !== "number" ||
    !Number.isFinite(session.expiresAt)
  )
    return "missing";
  if (session.expiresAt <= Date.now()) return "expired";
  return typeof session.user?.id === "string" && session.user.id && isRole(session.user.role)
    ? "valid"
    : "incomplete";
}

export function getToken(): string {
  const value: unknown = wx.getStorageSync(storageKey());
  if (typeof value !== "object" || value === null) return "";
  const session = value as Partial<Session>;
  return typeof session.token === "string" &&
    typeof session.expiresAt === "number" &&
    session.expiresAt > Date.now()
    ? session.token
    : "";
}

export function saveSession(session: Session) {
  wx.setStorageSync(storageKey(), session);
}
export function clearSession() {
  wx.removeStorageSync(storageKey());
}

export function getRole(): Role | undefined {
  if (!getToken()) return undefined;
  const value = wx.getStorageSync(storageKey()) as Partial<Session> | undefined;
  return isRole(value?.user?.role) ? value.user.role : undefined;
}

export function updateAccount(user: Account) {
  if (!getToken()) return;
  const value = wx.getStorageSync(storageKey()) as Session;
  saveSession({ ...value, user });
}

export function updateRole(role: Role) {
  if (!getToken()) return;
  const value = wx.getStorageSync(storageKey()) as Session;
  saveSession({ ...value, user: { ...value.user, role } });
}

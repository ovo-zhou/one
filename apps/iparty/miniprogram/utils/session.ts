import { getApiBaseUrl } from "../config/api";
import { isRole, type Account, type Role } from "../models/account";
import { clearGetCache } from "./get-cache";

type Session = { token: string; expiresAt: number; user: Account };
export type SessionState = "missing" | "expired" | "incomplete" | "valid";
let revision = 0;

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

export function getSessionRevision(): number {
  return revision;
}

function discardCachedData() {
  revision += 1;
  clearGetCache();
}

export function saveSession(session: Session) {
  const key = storageKey();
  const previous = wx.getStorageSync(key) as Partial<Session> | undefined;
  wx.setStorageSync(key, session);
  if (
    previous?.token !== session.token ||
    previous?.user?.id !== session.user.id ||
    previous?.user?.role !== session.user.role
  ) {
    discardCachedData();
  }
}
export function clearSession() {
  wx.removeStorageSync(storageKey());
  discardCachedData();
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

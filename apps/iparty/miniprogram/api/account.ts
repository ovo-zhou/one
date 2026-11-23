import type { Account } from "../models/account";
import { authenticatedRequest } from "../utils/authenticated-request";
import { updateAccount } from "../utils/session";

export async function getCurrentAccount(): Promise<Account> {
  const { user } = await authenticatedRequest<{ user: Account }>("/api/v1/auth/me");
  updateAccount(user);
  return user;
}

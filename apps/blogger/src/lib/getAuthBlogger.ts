import { google, blogger_v3 } from "googleapis";
import { getSession } from "./session";
import { createAuthClient } from "./googleAuth";

export async function getAuthBlogger(): Promise<blogger_v3.Blogger> {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  const auth = createAuthClient(
    session.access_token,
    session.refresh_token,
    session.expiry_date
  );
  return google.blogger({ version: "v3", auth });
}

import { google } from "googleapis";

const clientId = process.env.client_id!;
const clientSecret = process.env.client_secret!;
const baseUrl = process.env.NODE_ENV === "production"
  ? "https://cicihuang.vercel.app"
  : "http://localhost:1008";
const redirectUri = `${baseUrl}/api/auth/callback`;

export const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/blogger",
];

type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;
export const oauth2Client: OAuth2ClientType = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

export function getAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export function createAuthClient(
  accessToken: string,
  refreshToken?: string,
  expiryDate?: number
): OAuth2ClientType {
  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate,
  });
  return client;
}

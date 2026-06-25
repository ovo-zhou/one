import { NextResponse } from "next/server";
import { oauth2Client } from "../../../../lib/googleAuth";
import { createSession } from "../../../../lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let name: string | undefined;
  let email: string | undefined;
  let picture: string | undefined;
  if (tokens.id_token) {
    const ticket = await oauth2Client.verifyIdToken({ idToken: tokens.id_token });
    const info = ticket.getPayload();
    name = info?.name;
    email = info?.email;
    picture = info?.picture;
  }

  await createSession({
    access_token: tokens.access_token ?? "",
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
    name,
    email,
    picture,
  });

  return NextResponse.redirect(new URL("/", request.url));
}

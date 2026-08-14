import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { listActiveFiles } from "../../../../lib/locker";

export async function GET() {
  const session = await getSession();
  if (!session || session.email !== process.env.admin_email) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const files = await listActiveFiles();
  return NextResponse.json({ items: files });
}

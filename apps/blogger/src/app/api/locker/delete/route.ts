import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { deleteLockerFile } from "../../../../lib/locker";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.email !== process.env.admin_email) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { code } = (await request.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "缺少取件码" }, { status: 400 });
  }
  const ok = await deleteLockerFile(code);
  if (!ok) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

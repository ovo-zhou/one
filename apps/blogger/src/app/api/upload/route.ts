import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "../../../lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.email !== process.env.admin_email) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });

  return NextResponse.json({ url: blob.url });
}

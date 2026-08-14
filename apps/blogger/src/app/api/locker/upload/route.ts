import { NextResponse } from "next/server";
import { MAX_FILE_SIZE, uploadLockerFile } from "../../../../lib/locker";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "文件大小不能超过 4MB" }, { status: 413 });
  }
  try {
    const info = await uploadLockerFile(file);
    return NextResponse.json({ code: info.code, expiresAt: info.uploadedAt + info.remainingMs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "上传失败，请稍后重试" },
      { status: 409 }
    );
  }
}

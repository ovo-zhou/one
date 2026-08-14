import { NextRequest, after } from "next/server";
import { openLockerFile, removeLockerFile } from "../../../../lib/locker";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const opened = await openLockerFile(code);
  if (!opened) {
    await sleep(500);
    return new Response("取件码无效或已过期", { status: 404 });
  }
  const { stream, info, contentType, size } = opened;
  after(() => removeLockerFile(info));
  return new Response(stream, {
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(info.fileName)}`,
      "Content-Length": String(size),
      "Cache-Control": "private, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

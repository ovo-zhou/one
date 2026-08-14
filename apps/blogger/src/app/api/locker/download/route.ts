import { NextRequest } from "next/server";
import { consumeLockerFile } from "../../../../lib/locker";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const content = await consumeLockerFile(code);
  if (!content) {
    await sleep(500);
    return new Response("取件码无效或已过期", { status: 404 });
  }
  const { bytes, info, contentType, size } = content;
  return new Response(bytes, {
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(info.fileName)}`,
      "Content-Length": String(size),
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { MAX_FILES } from "../../../../lib/locker";
import { listActiveFiles } from "../../../../lib/locker";

export async function GET() {
  const items = await listActiveFiles();
  return NextResponse.json({
    used: items.length,
    total: MAX_FILES,
    items: items.map((f) => ({
      code: f.code,
      fileName: f.fileName,
      remainingMs: f.remainingMs,
    })),
  });
}

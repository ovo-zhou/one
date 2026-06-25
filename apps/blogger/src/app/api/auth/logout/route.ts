import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/session";

export async function GET() {
  await clearSession();
  const baseUrl = process.env.NODE_ENV === "production"
    ? "https://cicihuang.vercel.app"
    : "http://localhost:1008";
  return NextResponse.redirect(new URL("/", baseUrl));
}

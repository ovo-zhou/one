import { NextResponse } from "next/server";
import { getAuthUrl } from "../../../../lib/googleAuth";

export async function GET() {
  console.log(getAuthUrl())
  return NextResponse.redirect(getAuthUrl());
}

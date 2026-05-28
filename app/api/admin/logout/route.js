import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}

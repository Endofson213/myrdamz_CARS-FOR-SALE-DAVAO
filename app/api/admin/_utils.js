import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "../../../lib/admin-auth";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function requireAdmin(request) {
  const session = verifyToken(getTokenFromRequest(request));

  if (!session) {
    return {
      error: json({ error: "Authentication required." }, 401)
    };
  }

  return { session };
}

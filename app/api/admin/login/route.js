import { NextResponse } from "next/server";
import { createToken, setAuthCookie, verifyPassword } from "../../../../lib/admin-auth";
import { readDb } from "../../../../lib/admin-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const { username, password } = await request.json();
  const db = await readDb();
  const user = db.users.find((item) => item.username === String(username || "").trim());

  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = createToken(user);
  const response = NextResponse.json({ user: { id: user.id, username: user.username } });
  setAuthCookie(response, token);
  return response;
}

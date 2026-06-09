import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createToken, hashPassword, setAuthCookie } from "../../../../lib/admin-auth";
import { readLocalDb, writeLocalDb } from "../../../../lib/admin-store";

export async function POST(request) {
  const db = await readLocalDb();

  if (db.users.length > 0) {
    return NextResponse.json({ error: "Admin setup has already been completed." }, { status: 409 });
  }

  const { username, password } = await request.json();

  if (!username || !password || password.length < 8) {
    return NextResponse.json({ error: "Use a username and a password with at least 8 characters." }, { status: 400 });
  }

  const user = {
    id: crypto.randomUUID(),
    username: String(username).trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  await writeLocalDb({ ...db, users: [user] });

  const token = createToken(user);
  const response = NextResponse.json({ user: { id: user.id, username: user.username } });
  setAuthCookie(response, token);
  return response;
}

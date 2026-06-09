import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createToken, hashPassword, setAuthCookie } from "../../../../lib/admin-auth";
import { countAdminUsers, createAdminUser } from "../../../../lib/admin-store";

function secretsMatch(provided, expected) {
  const providedBuffer = Buffer.from(String(provided || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));

  return providedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request) {
  try {
    if (await countAdminUsers()) {
      return NextResponse.json({ error: "Admin setup has already been completed." }, { status: 409 });
    }

    const { username, password, setupCode } = await request.json();
    const normalizedUsername = String(username || "").trim().toLowerCase();

    if (!process.env.ADMIN_SETUP_SECRET || process.env.ADMIN_SETUP_SECRET.length < 16) {
      return NextResponse.json({ error: "Admin setup is not configured." }, { status: 503 });
    }

    if (!secretsMatch(setupCode, process.env.ADMIN_SETUP_SECRET)) {
      return NextResponse.json({ error: "Invalid admin setup code." }, { status: 403 });
    }

    if (!/^[a-z0-9._-]{3,40}$/.test(normalizedUsername)) {
      return NextResponse.json({
        error: "Username must be 3-40 characters using letters, numbers, dots, dashes, or underscores."
      }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      return NextResponse.json({
        error: "Use a password between 12 and 128 characters."
      }, { status: 400 });
    }

    const user = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    await createAdminUser(user);

    const token = createToken(user);
    const response = NextResponse.json({ user: { id: user.id, username: user.username } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin setup failed:", error);
    return NextResponse.json({ error: "Admin setup is temporarily unavailable." }, { status: 503 });
  }
}

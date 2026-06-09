import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createToken, setAuthCookie, verifyPassword } from "../../../../lib/admin-auth";
import { findAdminUser } from "../../../../lib/admin-store";
import {
  clearAdminLoginAttempt,
  readAdminLoginAttempt,
  saveAdminLoginAttempt
} from "../../../../lib/supabase-store";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttemptIdentifier(request, username) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0].trim() || "unknown";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${String(username || "").trim().toLowerCase()}`)
    .digest("hex");
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const identifier = getAttemptIdentifier(request, username);
    const now = Date.now();
    const previousAttempt = await readAdminLoginAttempt(identifier);
    const blockedUntil = previousAttempt?.blocked_until
      ? new Date(previousAttempt.blocked_until).getTime()
      : 0;

    if (blockedUntil > now) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((blockedUntil - now) / 1000)) }
        }
      );
    }

    const user = await findAdminUser(username);

    if (!user || !verifyPassword(password || "", user.passwordHash)) {
      const windowStarted = previousAttempt?.window_started
        ? new Date(previousAttempt.window_started).getTime()
        : 0;
      const withinWindow = now - windowStarted < ATTEMPT_WINDOW_MS;
      const attempts = withinWindow ? Number(previousAttempt?.attempts || 0) + 1 : 1;

      await saveAdminLoginAttempt({
        identifier,
        attempts,
        window_started: new Date(withinWindow ? windowStarted : now).toISOString(),
        blocked_until: attempts >= MAX_ATTEMPTS
          ? new Date(now + BLOCK_DURATION_MS).toISOString()
          : null
      });

      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    await clearAdminLoginAttempt(identifier);
    const token = createToken(user);
    const response = NextResponse.json({ user: { id: user.id, username: user.username } });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Admin login is temporarily unavailable." }, { status: 503 });
  }
}

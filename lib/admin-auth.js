import crypto from "node:crypto";

const COOKIE_NAME = "myrdamz_admin_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production.");
  }

  return "dev-only-myrdamz-admin-secret";
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function parseBase64Url(input) {
  return JSON.parse(Buffer.from(input, "base64url").toString("utf8"));
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedValue) {
  const [salt, expectedHash] = storedValue.split(":");
  if (!salt || !expectedHash) return false;

  const actualHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    sub: user.id,
    username: user.username,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  }));
  const body = `${header}.${payload}`;
  return `${body}.${signPayload(body)}`;
}

export function verifyToken(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const body = `${header}.${payload}`;
  const expectedSignature = signPayload(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  const data = parseBase64Url(payload);
  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}

export function setAuthCookie(response, token) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS
  });
}

export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function getTokenFromRequest(request) {
  return request.cookies.get(COOKIE_NAME)?.value;
}

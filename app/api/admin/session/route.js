import { getTokenFromRequest, verifyToken } from "../../../../lib/admin-auth";
import { readDb } from "../../../../lib/admin-store";
import { json } from "../_utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const db = await readDb();
  const session = verifyToken(getTokenFromRequest(request));

  return json({
    authenticated: Boolean(session),
    setupRequired: db.users.length === 0,
    user: session ? { id: session.sub, username: session.username } : null
  });
}

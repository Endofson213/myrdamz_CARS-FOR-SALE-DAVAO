import { getTokenFromRequest, verifyToken } from "../../../../lib/admin-auth";
import { readLocalDb } from "../../../../lib/admin-store";
import { json } from "../_utils";


export async function GET(request) {
  const db = await readLocalDb();
  const session = verifyToken(getTokenFromRequest(request));

  return json({
    authenticated: Boolean(session),
    setupRequired: db.users.length === 0,
    user: session ? { id: session.sub, username: session.username } : null
  });
}

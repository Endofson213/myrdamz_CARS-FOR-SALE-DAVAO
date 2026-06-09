import { getTokenFromRequest, verifyToken } from "../../../../lib/admin-auth";
import { countAdminUsers } from "../../../../lib/admin-store";
import { json } from "../_utils";

export async function GET(request) {
  try {
    const session = verifyToken(getTokenFromRequest(request));
    const adminUserCount = await countAdminUsers();

    return json({
      authenticated: Boolean(session),
      setupRequired: adminUserCount === 0,
      user: session ? { id: session.sub, username: session.username } : null
    });
  } catch (error) {
    console.error("Admin session check failed:", error);
    return json({ error: "Admin access is temporarily unavailable." }, 503);
  }
}

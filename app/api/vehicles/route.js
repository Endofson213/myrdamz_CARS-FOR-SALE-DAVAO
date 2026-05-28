import { readDb } from "../../../lib/admin-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return Response.json({ vehicles: db.vehicles, updatedAt: db.updatedAt });
}

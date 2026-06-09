import { readDb } from "../../../lib/admin-store";

export async function GET() {
  const db = await readDb();
  return Response.json({ vehicles: db.vehicles, updatedAt: db.updatedAt });
}

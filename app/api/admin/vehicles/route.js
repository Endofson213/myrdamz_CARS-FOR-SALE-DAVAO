import { createHistoryEntry, makeUniqueVehicleId, pushHistory, readDb, normalizeVehicle, writeDb } from "../../../../lib/admin-store";
import { json, requireAdmin } from "../_utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const db = await readDb();
  return json({ vehicles: db.vehicles, history: db.history, updatedAt: db.updatedAt });
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const db = await readDb();
  const vehicle = normalizeVehicle(await request.json());

  if (!vehicle.name) {
    return json({ error: "Vehicle name is required." }, 400);
  }

  vehicle.id = makeUniqueVehicleId(vehicle.name, db.vehicles);

  const history = pushHistory(db.history, createHistoryEntry("add", { vehicle }));
  const nextDb = await writeDb({ ...db, vehicles: [vehicle, ...db.vehicles], history });
  return json({ vehicle, history: nextDb.history, updatedAt: nextDb.updatedAt }, 201);
}

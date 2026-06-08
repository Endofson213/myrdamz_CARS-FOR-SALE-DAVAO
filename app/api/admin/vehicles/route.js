import {
  createHistoryEntry,
  makeUniqueVehicleId,
  normalizeVehicle,
  pushHistory,
  readAdminDb,
  writeDb
} from "../../../../lib/admin-store";
import { insertSupabaseVehicle, isSupabaseConfigured } from "../../../../lib/supabase-store";
import { json, requireAdmin } from "../_utils";

function vehicleError(error, status = 500) {
  return json({ error: error instanceof Error ? error.message : "Vehicle data could not be saved." }, status);
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await readAdminDb();
    return json({ vehicles: db.vehicles, history: db.history, updatedAt: db.updatedAt });
  } catch (error) {
    return vehicleError(error, 503);
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await readAdminDb();
    const vehicle = normalizeVehicle(await request.json());

    if (!vehicle.name) {
      return json({ error: "Vehicle name is required." }, 400);
    }

    vehicle.id = makeUniqueVehicleId(vehicle.name, db.vehicles);

    if (isSupabaseConfigured()) {
      await insertSupabaseVehicle(vehicle);
      return json({ vehicle, history: [], updatedAt: new Date().toISOString() }, 201);
    }

    const history = pushHistory(db.history, createHistoryEntry("add", { vehicle }));
    const nextDb = await writeDb({ ...db, vehicles: [vehicle, ...db.vehicles], history });
    return json({ vehicle, history: nextDb.history, updatedAt: nextDb.updatedAt }, 201);
  } catch (error) {
    return vehicleError(error);
  }
}

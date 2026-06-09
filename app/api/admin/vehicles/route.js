import {
  makeUniqueVehicleId,
  normalizeVehicle,
  readAdminDb,
  validateVehicleInput,
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
    return json({ vehicles: db.vehicles, updatedAt: db.updatedAt });
  } catch (error) {
    return vehicleError(error, 503);
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await readAdminDb();
    const input = await request.json();
    const validationErrors = validateVehicleInput(input);

    if (validationErrors.length) {
      return json({ error: validationErrors[0], errors: validationErrors }, 400);
    }

    const vehicle = normalizeVehicle(input);
    vehicle.id = makeUniqueVehicleId(vehicle.name, db.vehicles);

    if (isSupabaseConfigured()) {
      await insertSupabaseVehicle(vehicle);
      return json({ vehicle, updatedAt: new Date().toISOString() }, 201);
    }

    const nextDb = await writeDb({ ...db, vehicles: [vehicle, ...db.vehicles] });
    return json({ vehicle, updatedAt: nextDb.updatedAt }, 201);
  } catch (error) {
    return vehicleError(error);
  }
}

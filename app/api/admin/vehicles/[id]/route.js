import {
  createHistoryEntry,
  deleteUploadedImageIfUnused,
  normalizeVehicle,
  pushHistory,
  readAdminDb,
  writeDb
} from "../../../../../lib/admin-store";
import {
  deleteSupabaseVehicle,
  isSupabaseConfigured,
  updateSupabaseVehicle
} from "../../../../../lib/supabase-store";
import { json, requireAdmin } from "../../_utils";

function vehicleError(error, status = 500) {
  return json({ error: error instanceof Error ? error.message : "Vehicle data could not be saved." }, status);
}

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const db = await readAdminDb();
    const vehicle = normalizeVehicle({ ...(await request.json()), id });
    vehicle.id = id;
    const index = db.vehicles.findIndex((item) => item.id === id);

    if (index === -1) {
      return json({ error: "Vehicle not found." }, 404);
    }

    const vehicles = [...db.vehicles];
    const before = vehicles[index];
    vehicles[index] = vehicle;

    if (isSupabaseConfigured()) {
      await updateSupabaseVehicle(id, vehicle);
      const previousImages = new Set(vehicle.images || [vehicle.image].filter(Boolean));
      const removedImages = (before.images || [before.image].filter(Boolean)).filter((image) => !previousImages.has(image));
      if (removedImages.length) {
        await deleteUploadedImageIfUnused(removedImages, vehicles);
      }
      return json({ vehicle, history: [], updatedAt: new Date().toISOString() });
    }

    const history = pushHistory(db.history, createHistoryEntry("edit", { before, after: vehicle }));
    const nextDb = await writeDb({ ...db, vehicles, history });
    return json({ vehicle, history: nextDb.history, updatedAt: nextDb.updatedAt });
  } catch (error) {
    return vehicleError(error);
  }
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const db = await readAdminDb();
    const deletedVehicle = db.vehicles.find((item) => item.id === id);
    const vehicles = db.vehicles.filter((item) => item.id !== id);

    if (vehicles.length === db.vehicles.length) {
      return json({ error: "Vehicle not found." }, 404);
    }

    if (isSupabaseConfigured()) {
      await deleteSupabaseVehicle(id);
      await deleteUploadedImageIfUnused(deletedVehicle.images || deletedVehicle.image, vehicles);
      return json({ ok: true, history: [], updatedAt: new Date().toISOString() });
    }

    const history = pushHistory(db.history, createHistoryEntry("delete", { vehicle: deletedVehicle }));
    const nextDb = await writeDb({ ...db, vehicles, history });
    return json({ ok: true, history: nextDb.history, updatedAt: nextDb.updatedAt });
  } catch (error) {
    return vehicleError(error);
  }
}

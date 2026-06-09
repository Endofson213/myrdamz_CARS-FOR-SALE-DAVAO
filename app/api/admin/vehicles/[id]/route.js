import {
  deleteUploadedImageIfUnused,
  normalizeVehicle,
  readAdminDb,
  validateVehicleInput,
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
    const input = await request.json();
    const validationErrors = validateVehicleInput(input);

    if (validationErrors.length) {
      return json({ error: validationErrors[0], errors: validationErrors }, 400);
    }

    const vehicle = normalizeVehicle({ ...input, id });
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
      let warning = "";
      const previousImages = new Set(vehicle.images || [vehicle.image].filter(Boolean));
      const removedImages = (before.images || [before.image].filter(Boolean)).filter((image) => !previousImages.has(image));
      if (removedImages.length) {
        try {
          await deleteUploadedImageIfUnused(removedImages, vehicles);
        } catch (error) {
          console.error("Vehicle photo cleanup scheduling failed:", error);
          warning = "Vehicle saved, but removed-photo cleanup could not be scheduled.";
        }
      }
      return json({ vehicle, warning, updatedAt: new Date().toISOString() });
    }

    const nextDb = await writeDb({ ...db, vehicles });
    return json({ vehicle, updatedAt: nextDb.updatedAt });
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
      let warning = "";
      try {
        await deleteUploadedImageIfUnused(deletedVehicle.images || deletedVehicle.image, vehicles);
      } catch (error) {
        console.error("Deleted vehicle photo cleanup scheduling failed:", error);
        warning = "Vehicle deleted, but its photo cleanup could not be scheduled.";
      }
      return json({ ok: true, warning, updatedAt: new Date().toISOString() });
    }

    const nextDb = await writeDb({ ...db, vehicles });
    return json({ ok: true, updatedAt: nextDb.updatedAt });
  } catch (error) {
    return vehicleError(error);
  }
}

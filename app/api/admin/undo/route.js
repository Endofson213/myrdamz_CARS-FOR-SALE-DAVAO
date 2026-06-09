import { deleteUploadedImageIfUnused, readDb, writeDb } from "../../../../lib/admin-store";
import { isSupabaseConfigured } from "../../../../lib/supabase-store";
import { json, requireAdmin } from "../_utils";

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  if (isSupabaseConfigured()) {
    return json({ error: "Undo is unavailable while vehicles are stored in Supabase." }, 400);
  }

  const db = await readDb();
  const [entry, ...history] = db.history;

  if (!entry) {
    return json({ error: "There is no admin action to undo." }, 400);
  }

  let vehicles = db.vehicles;

  if (entry.type === "add") {
    vehicles = vehicles.filter((vehicle) => vehicle.id !== entry.vehicle?.id);
    await deleteUploadedImageIfUnused(entry.vehicle?.images || entry.vehicle?.image, vehicles);
  } else if (entry.type === "delete") {
    const restored = entry.vehicle;
    if (!restored) return json({ error: "Undo data is incomplete." }, 400);
    vehicles = vehicles.some((vehicle) => vehicle.id === restored.id)
      ? vehicles
      : [restored, ...vehicles];
  } else if (entry.type === "edit") {
    const previous = entry.before;
    if (!previous) return json({ error: "Undo data is incomplete." }, 400);
    const index = vehicles.findIndex((vehicle) => vehicle.id === previous.id);
    vehicles = index === -1
      ? [previous, ...vehicles]
      : vehicles.map((vehicle) => (vehicle.id === previous.id ? previous : vehicle));
    const previousImages = new Set(previous.images || [previous.image].filter(Boolean));
    const removedImages = (entry.after?.images || [entry.after?.image].filter(Boolean)).filter((image) => !previousImages.has(image));
    if (removedImages.length) {
      await deleteUploadedImageIfUnused(removedImages, vehicles);
    }
  } else {
    return json({ error: "This admin action cannot be undone." }, 400);
  }

  const nextDb = await writeDb({ ...db, vehicles, history });
  return json({
    undone: entry.label,
    vehicles: nextDb.vehicles,
    history: nextDb.history,
    updatedAt: nextDb.updatedAt
  });
}

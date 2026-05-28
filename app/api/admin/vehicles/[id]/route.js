import { createHistoryEntry, pushHistory, readDb, normalizeVehicle, writeDb } from "../../../../../lib/admin-store";
import { json, requireAdmin } from "../../_utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await readDb();
  const vehicle = normalizeVehicle({ ...(await request.json()), id });
  vehicle.id = id;
  const index = db.vehicles.findIndex((item) => item.id === id);

  if (index === -1) {
    return json({ error: "Vehicle not found." }, 404);
  }

  const vehicles = [...db.vehicles];
  const before = vehicles[index];
  vehicles[index] = vehicle;
  const history = pushHistory(db.history, createHistoryEntry("edit", { before, after: vehicle }));
  const nextDb = await writeDb({ ...db, vehicles, history });
  return json({ vehicle, history: nextDb.history, updatedAt: nextDb.updatedAt });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await readDb();
  const deletedVehicle = db.vehicles.find((item) => item.id === id);
  const vehicles = db.vehicles.filter((item) => item.id !== id);

  if (vehicles.length === db.vehicles.length) {
    return json({ error: "Vehicle not found." }, 404);
  }

  const history = pushHistory(db.history, createHistoryEntry("delete", { vehicle: deletedVehicle }));
  const nextDb = await writeDb({ ...db, vehicles, history });
  return json({ ok: true, history: nextDb.history, updatedAt: nextDb.updatedAt });
}

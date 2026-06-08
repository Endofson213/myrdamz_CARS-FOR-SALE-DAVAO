import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const VEHICLES_TABLE = "vehicles";
const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";

let cachedAdminClient = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return cachedAdminClient;
}

function toVehicleRow(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    seats: vehicle.seats,
    status: vehicle.status,
    image: vehicle.image,
    images: vehicle.images || [],
    accent: vehicle.accent,
    description: vehicle.description,
    financing: vehicle.financing || {},
    updated_at: new Date().toISOString()
  };
}

export async function readSupabaseVehicles() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase vehicle read failed:", error.message);
    return null;
  }

  return Array.isArray(data) ? data : [];
}

export async function syncSupabaseVehicles(vehicles) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const rows = vehicles.map((vehicle) => toVehicleRow(vehicle));

  if (rows.length) {
    const { error } = await supabase
      .from(VEHICLES_TABLE)
      .upsert(rows, { onConflict: "id" });

    if (error) throw new Error(`Supabase vehicle save failed: ${error.message}`);
  }

  const { data: existingRows, error: readError } = await supabase
    .from(VEHICLES_TABLE)
    .select("id");

  if (readError) throw new Error(`Supabase vehicle cleanup read failed: ${readError.message}`);

  const nextIds = new Set(rows.map((row) => row.id));
  const removedIds = (existingRows || [])
    .map((row) => row.id)
    .filter((id) => id && !nextIds.has(id));

  if (removedIds.length) {
    const { error } = await supabase
      .from(VEHICLES_TABLE)
      .delete()
      .in("id", removedIds);

    if (error) throw new Error(`Supabase vehicle cleanup failed: ${error.message}`);
  }

  return true;
}

export async function uploadVehiclePhoto({ bytes, contentType, extension }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const fileName = `${crypto.randomUUID()}.${extension}`;
  const objectPath = `uploads/${fileName}`;
  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(objectPath, bytes, {
      contentType,
      upsert: false
    });

  if (error) throw new Error(`Supabase photo upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

function getVehiclePhotoObjectPath(url) {
  if (!url || !process.env.NEXT_PUBLIC_SUPABASE_URL) return "";

  try {
    const parsed = new URL(url);
    const projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
    if (parsed.host !== projectHost) return "";

    const marker = `/storage/v1/object/public/${VEHICLE_PHOTOS_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return "";

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
}

export async function deleteVehiclePhoto(url) {
  const supabase = getSupabaseAdmin();
  const objectPath = getVehiclePhotoObjectPath(url);
  if (!supabase || !objectPath) return false;

  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .remove([objectPath]);

  if (error) {
    console.error("Supabase photo delete failed:", error.message);
    return false;
  }

  return true;
}

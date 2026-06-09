import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const VEHICLES_TABLE = "vehicles";
const SITE_SETTINGS_TABLE = "site_settings";
const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";
const HERO_IMAGES_KEY = "hero_images";
const READ_TIMEOUT_MS = 4500;
const UPLOAD_TIMEOUT_MS = 25000;
const VEHICLE_CACHE_MS = 15000;
const HERO_CACHE_MS = 30000;

let cachedAdminClient = null;
let cachedVehicles = null;
let cachedVehiclesAt = 0;
let cachedHeroImages = null;
let cachedHeroImagesAt = 0;

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

function clearVehicleCache() {
  cachedVehicles = null;
  cachedVehiclesAt = 0;
}

function clearHeroCache() {
  cachedHeroImages = null;
  cachedHeroImagesAt = 0;
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
    sold_date: vehicle.status === "Sold" ? vehicle.soldDate || null : null,
    image: vehicle.image,
    images: vehicle.images || [],
    accent: vehicle.accent,
    description: vehicle.description,
    financing: vehicle.financing || {},
    updated_at: new Date().toISOString()
  };
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export async function readSupabaseVehicles({ throwOnError = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  if (cachedVehicles && Date.now() - cachedVehiclesAt < VEHICLE_CACHE_MS) {
    return cachedVehicles;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(VEHICLES_TABLE)
        .select("*")
        .order("created_at", { ascending: false }),
      READ_TIMEOUT_MS,
      "Supabase vehicle read"
    );

    if (error) {
      console.error("Supabase vehicle read failed:", error.message);
      if (throwOnError) throw new Error(`Supabase vehicle read failed: ${error.message}`);
      return null;
    }

    cachedVehicles = Array.isArray(data) ? data : [];
    cachedVehiclesAt = Date.now();
    return cachedVehicles;
  } catch (error) {
    console.error("Supabase vehicle read failed:", error instanceof Error ? error.message : error);
    if (throwOnError) throw error;
    return null;
  }
}

export async function insertSupabaseVehicle(vehicle) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .insert(toVehicleRow(vehicle))
    .select("*")
    .single();

  if (error) throw new Error(`Supabase vehicle create failed: ${error.message}`);

  clearVehicleCache();
  return data;
}

export async function updateSupabaseVehicle(id, vehicle) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(VEHICLES_TABLE)
    .update(toVehicleRow(vehicle))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Supabase vehicle update failed: ${error.message}`);

  clearVehicleCache();
  return data;
}

export async function deleteSupabaseVehicle(id) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from(VEHICLES_TABLE)
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Supabase vehicle delete failed: ${error.message}`);

  clearVehicleCache();
  return true;
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

  clearVehicleCache();
  return true;
}

export async function uploadVehiclePhoto({ bytes, contentType, extension }) {
  return uploadStorageImage({
    bytes,
    contentType,
    extension,
    folder: "uploads",
    label: "vehicle photo"
  });
}

export async function uploadHeroImage({ bytes, contentType, extension }) {
  return uploadStorageImage({
    bytes,
    contentType,
    extension,
    folder: "hero",
    label: "hero image"
  });
}

async function uploadStorageImage({ bytes, contentType, extension, folder, label }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const fileName = `${crypto.randomUUID()}.${extension}`;
  const objectPath = `${folder}/${fileName}`;
  const { error } = await withTimeout(
    supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .upload(objectPath, bytes, {
        contentType,
        upsert: false
      }),
    UPLOAD_TIMEOUT_MS,
    `Supabase ${label} upload`
  );

  if (error) throw new Error(`Supabase ${label} upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

function getStorageObjectPath(url) {
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
  return deleteStorageImage(url, "photo");
}

export async function deleteHeroImage(url) {
  return deleteStorageImage(url, "hero image");
}

async function deleteStorageImage(url, label) {
  const supabase = getSupabaseAdmin();
  const objectPath = getStorageObjectPath(url);
  if (!supabase || !objectPath) return false;

  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .remove([objectPath]);

  if (error) {
    console.error(`Supabase ${label} delete failed:`, error.message);
    return false;
  }

  return true;
}

function normalizeHeroImages(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((image) => String(image || "").trim()).filter(Boolean)))
    : [];
}

export async function readSupabaseHeroImages({ throwOnError = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  if (cachedHeroImages && Date.now() - cachedHeroImagesAt < HERO_CACHE_MS) {
    return cachedHeroImages;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from(SITE_SETTINGS_TABLE)
        .select("value")
        .eq("key", HERO_IMAGES_KEY)
        .maybeSingle(),
      READ_TIMEOUT_MS,
      "Supabase hero image read"
    );

    if (error) {
      if (throwOnError) throw new Error(`Supabase hero image read failed: ${error.message}`);
      return null;
    }

    cachedHeroImages = normalizeHeroImages(data?.value);
    cachedHeroImagesAt = Date.now();
    return cachedHeroImages;
  } catch (error) {
    if (throwOnError) throw error;
    return null;
  }
}

export async function saveSupabaseHeroImages(images) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const normalizedImages = normalizeHeroImages(images);
  const { error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .upsert({
      key: HERO_IMAGES_KEY,
      value: normalizedImages,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });

  if (error) throw new Error(`Supabase hero image save failed: ${error.message}`);

  clearHeroCache();
  return normalizedImages;
}

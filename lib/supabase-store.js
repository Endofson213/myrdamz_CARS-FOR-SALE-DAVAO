import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const VEHICLES_TABLE = "vehicles";
const ADMIN_USERS_TABLE = "admin_users";
const ADMIN_LOGIN_ATTEMPTS_TABLE = "admin_login_attempts";
const SITE_SETTINGS_TABLE = "site_settings";
const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";
const HERO_IMAGES_KEY = "hero_images";
const PENDING_IMAGE_DELETIONS_KEY = "pending_image_deletions";
const READ_TIMEOUT_MS = 4500;
const UPLOAD_TIMEOUT_MS = 25000;
const VEHICLE_CACHE_MS = 15000;
const HERO_CACHE_MS = 30000;
const IMAGE_DELETE_DELAY_MS = 24 * 60 * 60 * 1000;

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

export async function countSupabaseAdminUsers() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from(ADMIN_USERS_TABLE)
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`Supabase admin user check failed: ${error.message}`);
  return count || 0;
}

export async function findSupabaseAdminUser(username) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const normalizedUsername = String(username || "").trim().toLowerCase();
  if (!normalizedUsername) return null;

  const { data, error } = await supabase
    .from(ADMIN_USERS_TABLE)
    .select("id,username,password_hash,created_at")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (error) throw new Error(`Supabase admin user read failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    passwordHash: data.password_hash,
    createdAt: data.created_at
  };
}

export async function createSupabaseAdminUser(user) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const row = {
    id: user.id,
    username: String(user.username || "").trim().toLowerCase(),
    password_hash: user.passwordHash,
    created_at: user.createdAt
  };
  const { data, error } = await supabase
    .from(ADMIN_USERS_TABLE)
    .insert(row)
    .select("id,username,created_at")
    .single();

  if (error) throw new Error(`Supabase admin user create failed: ${error.message}`);

  return {
    id: data.id,
    username: data.username,
    createdAt: data.created_at
  };
}

export async function readAdminLoginAttempt(identifier) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(ADMIN_LOGIN_ATTEMPTS_TABLE)
    .select("identifier,attempts,window_started,blocked_until")
    .eq("identifier", identifier)
    .maybeSingle();

  if (error) throw new Error(`Supabase login attempt read failed: ${error.message}`);
  return data;
}

export async function saveAdminLoginAttempt(attempt) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from(ADMIN_LOGIN_ATTEMPTS_TABLE)
    .upsert(attempt, { onConflict: "identifier" });

  if (error) throw new Error(`Supabase login attempt save failed: ${error.message}`);
  return true;
}

export async function clearAdminLoginAttempt(identifier) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from(ADMIN_LOGIN_ATTEMPTS_TABLE)
    .delete()
    .eq("identifier", identifier);

  if (error) throw new Error(`Supabase login attempt cleanup failed: ${error.message}`);
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

function normalizePendingImageDeletions(value) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const url = String(item?.url || "").trim();
    const deleteAfter = String(item?.deleteAfter || "").trim();

    if (!url || Number.isNaN(new Date(deleteAfter).getTime())) return [];
    return [{ url, deleteAfter }];
  });
}

async function readSiteSetting(key) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(`Supabase site setting read failed: ${error.message}`);
  return data?.value ?? null;
}

async function saveSiteSetting(key, value) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });

  if (error) throw new Error(`Supabase site setting save failed: ${error.message}`);
  return true;
}

export async function scheduleVehiclePhotoDeletion(urls, { resetDelay = false } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const candidates = Array.from(new Set(
    (Array.isArray(urls) ? urls : [urls])
      .map((url) => String(url || "").trim())
      .filter((url) => getStorageObjectPath(url).startsWith("uploads/"))
  ));
  if (!candidates.length) return false;

  const current = normalizePendingImageDeletions(
    await readSiteSetting(PENDING_IMAGE_DELETIONS_KEY)
  );
  const pendingByUrl = new Map(current.map((item) => [item.url, item]));
  const deleteAfter = new Date(Date.now() + IMAGE_DELETE_DELAY_MS).toISOString();

  for (const url of candidates) {
    if (resetDelay || !pendingByUrl.has(url)) {
      pendingByUrl.set(url, { url, deleteAfter });
    }
  }

  await saveSiteSetting(PENDING_IMAGE_DELETIONS_KEY, [...pendingByUrl.values()]);
  return true;
}

export async function cleanupExpiredVehiclePhotos() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { checked: 0, deleted: 0, remaining: 0 };

  const pending = normalizePendingImageDeletions(
    await readSiteSetting(PENDING_IMAGE_DELETIONS_KEY)
  );
  if (!pending.length) return { checked: 0, deleted: 0, remaining: 0 };

  const { data: vehicles, error } = await supabase
    .from(VEHICLES_TABLE)
    .select("image,images");

  if (error) throw new Error(`Supabase vehicle image check failed: ${error.message}`);

  const referencedImages = new Set(
    (vehicles || []).flatMap((vehicle) => [
      vehicle.image,
      ...(Array.isArray(vehicle.images) ? vehicle.images : [])
    ]).filter(Boolean)
  );
  const now = Date.now();
  const remaining = [];
  let deleted = 0;

  for (const item of pending) {
    if (referencedImages.has(item.url)) continue;
    if (new Date(item.deleteAfter).getTime() > now) {
      remaining.push(item);
      continue;
    }

    if (await deleteVehiclePhoto(item.url)) {
      deleted += 1;
    } else {
      remaining.push(item);
    }
  }

  await saveSiteSetting(PENDING_IMAGE_DELETIONS_KEY, remaining);
  return { checked: pending.length, deleted, remaining: remaining.length };
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

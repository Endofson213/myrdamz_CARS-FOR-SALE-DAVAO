import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const uploadsDir = path.join(root, "public", "uploads");
const bucketName = "vehicle-photos";
const tableName = "vehicles";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

async function loadLocalEnv() {
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional when vars are already exported in the shell.
  }
}

function getLocalUploadName(imageUrl) {
  const image = String(imageUrl || "").trim();
  if (!image.startsWith("/uploads/")) return "";
  return path.basename(image);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

await loadLocalEnv();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  console.error("Add them to .env.local, then run npm run migrate:images:supabase again.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const { data: vehicles, error: readError } = await supabase
  .from(tableName)
  .select("id,image,images");

if (readError) {
  console.error(`Could not read vehicles: ${readError.message}`);
  process.exit(1);
}

if (!vehicles?.length) {
  console.log("No Supabase vehicles found. Seed vehicles before migrating images.");
  process.exit(0);
}

const uploadedUrls = new Map();
let uploadedCount = 0;
let updatedVehicleCount = 0;
let missingFileCount = 0;

async function uploadLocalImage(imageUrl) {
  const fileName = getLocalUploadName(imageUrl);
  if (!fileName) return imageUrl;
  if (uploadedUrls.has(fileName)) return uploadedUrls.get(fileName);

  const filePath = path.join(uploadsDir, fileName);
  if (!(await fileExists(filePath))) {
    missingFileCount += 1;
    console.warn(`Missing local image: ${imageUrl}`);
    return imageUrl;
  }

  const extension = path.extname(fileName).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const objectPath = `uploads/${fileName}`;
  const bytes = await fs.readFile(filePath);
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, bytes, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Could not upload ${fileName}: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(objectPath);

  uploadedCount += 1;
  uploadedUrls.set(fileName, data.publicUrl);
  return data.publicUrl;
}

for (const vehicle of vehicles) {
  const currentImages = Array.isArray(vehicle.images)
    ? vehicle.images
    : [vehicle.image].filter(Boolean);
  const nextImages = [];

  for (const image of currentImages) {
    const nextImage = await uploadLocalImage(image);
    if (nextImage && !nextImages.includes(nextImage)) {
      nextImages.push(nextImage);
    }
  }

  const nextCoverImage = nextImages[0] || await uploadLocalImage(vehicle.image);
  const changed =
    nextCoverImage !== vehicle.image ||
    JSON.stringify(nextImages) !== JSON.stringify(currentImages);

  if (!changed) continue;

  const { error } = await supabase
    .from(tableName)
    .update({
      image: nextCoverImage || "",
      images: nextImages,
      updated_at: new Date().toISOString()
    })
    .eq("id", vehicle.id);

  if (error) {
    throw new Error(`Could not update ${vehicle.id}: ${error.message}`);
  }

  updatedVehicleCount += 1;
}

console.log(`Uploaded ${uploadedCount} image files to Supabase Storage.`);
console.log(`Updated ${updatedVehicleCount} vehicle rows.`);
if (missingFileCount) {
  console.log(`${missingFileCount} local image reference${missingFileCount === 1 ? " was" : "s were"} missing.`);
}

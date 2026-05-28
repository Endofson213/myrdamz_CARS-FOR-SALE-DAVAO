import fs from "node:fs/promises";
import path from "node:path";
import { inventory, vehicleBodyTypes } from "../app/data/vehicles.js";

const DB_PATH = path.join(process.cwd(), "data", "admin-db.json");
const HISTORY_LIMIT = 10;

function createInitialDb() {
  return {
    users: [],
    vehicles: inventory.map((vehicle) => ({ ...vehicle })),
    history: [],
    updatedAt: new Date().toISOString()
  };
}

async function ensureDbFile() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(createInitialDb(), null, 2));
  }
}

export async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(raw);

  return {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles : [],
    history: Array.isArray(db.history) ? db.history : [],
    updatedAt: db.updatedAt || null
  };
}

export async function writeDb(db) {
  const nextDb = {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles : [],
    history: Array.isArray(db.history) ? db.history.slice(0, HISTORY_LIMIT) : [],
    updatedAt: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(nextDb, null, 2));
  return nextDb;
}

export function makeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeUniqueVehicleId(name, vehicles, currentId = "") {
  const base = makeSlug(name) || "vehicle";
  const usedIds = new Set(
    vehicles
      .map((vehicle) => vehicle.id)
      .filter((id) => id && id !== currentId)
  );

  if (!usedIds.has(base)) return base;

  let counter = 2;
  let candidate = `${base}-${counter}`;

  while (usedIds.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

export function createHistoryEntry(type, payload) {
  const labels = {
    add: `Added ${payload.vehicle?.name || "vehicle"}`,
    edit: `Edited ${payload.before?.name || payload.after?.name || "vehicle"}`,
    delete: `Deleted ${payload.vehicle?.name || "vehicle"}`
  };

  return {
    id: cryptoRandomId(),
    type,
    label: labels[type] || "Changed vehicle data",
    createdAt: new Date().toISOString(),
    ...payload
  };
}

export function pushHistory(history, entry) {
  return [entry, ...(Array.isArray(history) ? history : [])].slice(0, HISTORY_LIMIT);
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/[^0-9.-]+/g, "")) || 0;
}

const BODY_TYPE_ALIASES = {
  AUV: "MPV/AUV",
  MPV: "MPV/AUV",
  "Pickup Truck": "Pickup",
  Sports: "Sports Car",
  "Commercial Vehicle": "Commercial"
};

function normalizeBodyType(value) {
  const type = String(value || "").trim();
  const normalized = BODY_TYPE_ALIASES[type] || type;
  return vehicleBodyTypes.includes(normalized) ? normalized : vehicleBodyTypes[0];
}

export function normalizeVehicle(input) {
  const name = String(input.name || "").trim();
  const id = makeSlug(input.id || name);
  const images = Array.from(
    new Set(
      [
        ...(Array.isArray(input.images) ? input.images : []),
        input.image
      ]
        .map((image) => String(image || "").trim())
        .filter(Boolean)
    )
  );

  return {
    id,
    name,
    type: normalizeBodyType(input.type),
    year: parseNumber(input.year) || new Date().getFullYear(),
    price: parseNumber(input.price),
    mileage: parseNumber(input.mileage),
    fuel: String(input.fuel || "").trim(),
    transmission: String(input.transmission || "").trim(),
    seats: parseNumber(input.seats),
    status: ["Available", "Reserved", "Sold"].includes(input.status) ? input.status : "Available",
    image: images[0] || "",
    images,
    accent: String(input.accent || "#8f1d24").trim(),
    description: String(input.description || "").trim()
  };
}

export async function deleteUploadedImageIfUnused(image, vehicles) {
  if (Array.isArray(image)) {
    await Promise.all(image.map((item) => deleteUploadedImageIfUnused(item, vehicles)));
    return;
  }

  if (!image || !String(image).startsWith("/uploads/")) return;
  if (vehicles.some((vehicle) => vehicle.image === image || vehicle.images?.includes(image))) return;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, path.basename(image));
  const resolvedUploadDir = path.resolve(uploadDir);
  const resolvedFilePath = path.resolve(filePath);

  if (!resolvedFilePath.startsWith(`${resolvedUploadDir}${path.sep}`)) return;

  try {
    await fs.unlink(resolvedFilePath);
  } catch {
    // The image may already be gone; the database undo should still succeed.
  }
}

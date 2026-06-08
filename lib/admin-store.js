import fs from "node:fs/promises";
import path from "node:path";
import { inventory, vehicleBodyTypes } from "../app/data/vehicles.js";
import {
  deleteVehiclePhoto,
  isSupabaseConfigured,
  readSupabaseVehicles,
  syncSupabaseVehicles
} from "./supabase-store.js";

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

export async function readLocalDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(raw);

  return {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle)) : [],
    history: Array.isArray(db.history) ? db.history : [],
    updatedAt: db.updatedAt || null
  };
}

export async function readDb() {
  const localDb = await readLocalDb();

  if (!isSupabaseConfigured()) {
    return localDb;
  }

  const supabaseVehicles = await readSupabaseVehicles();
  const vehicles = supabaseVehicles?.length ? supabaseVehicles : localDb.vehicles;

  return {
    ...localDb,
    vehicles: vehicles.map((vehicle) => normalizeVehicle(vehicle))
  };
}

export async function writeDb(db) {
  const nextDb = {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle)) : [],
    history: Array.isArray(db.history) ? db.history.slice(0, HISTORY_LIMIT) : [],
    updatedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    await syncSupabaseVehicles(nextDb.vehicles);
    return nextDb;
  }

  return writeLocalDb(nextDb);
}

export async function writeLocalDb(db) {
  const nextDb = {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle)) : [],
    history: Array.isArray(db.history) ? db.history.slice(0, HISTORY_LIMIT) : [],
    updatedAt: db.updatedAt || new Date().toISOString()
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

export function parseLegacyFinancing(description) {
  const lines = String(description || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const downPaymentMatch = lines
    .map((line) => line.match(/\bDP\s*-\s*(?:DP\s*)?([\d,.]+\s*k?)/i))
    .find(Boolean);
  const parseLegacyAmount = (value) => {
    const normalized = String(value || "").replace(/,/g, "").trim();
    const multiplier = /k$/i.test(normalized) ? 1000 : 1;
    return parseNumber(normalized.replace(/k$/i, "")) * multiplier;
  };
  const terms = lines.flatMap((line) => {
    const match = line.match(/^(\d+)(?:\s*months?)?\s*-\s*([\d,.]+)/i);
    if (!match) return [];

    const rawTerm = Number(match[1]);
    const years = rawTerm >= 12 ? rawTerm / 12 : rawTerm;
    if (!Number.isInteger(years) || years < 1 || years > 5) return [];

    return [{ years, monthlyPayment: parseLegacyAmount(match[2]) }];
  });

  return {
    downPayment: downPaymentMatch ? parseLegacyAmount(downPaymentMatch[1]) : 0,
    terms
  };
}

function normalizeFinancing(input) {
  const legacy = parseLegacyFinancing(input.description);
  const source = input.financing || {};
  const sourceTerms = Array.isArray(source.terms) ? source.terms : [];
  const termValue = (years, flatValue) => {
    const savedTerm = sourceTerms.find((term) => Number(term.years) === years);
    return parseNumber(savedTerm?.monthlyPayment ?? flatValue)
      || legacy.terms.find((term) => term.years === years)?.monthlyPayment
      || 0;
  };

  return {
    downPayment: parseNumber(source.downPayment ?? input.downPayment) || legacy.downPayment,
    terms: [2, 3, 4, 5].map((years) => ({
      years,
      monthlyPayment: termValue(years, input[`payment${years}Years`])
    }))
  };
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
    description: String(input.description || "").trim(),
    financing: normalizeFinancing(input)
  };
}

export async function deleteUploadedImageIfUnused(image, vehicles) {
  if (Array.isArray(image)) {
    await Promise.all(image.map((item) => deleteUploadedImageIfUnused(item, vehicles)));
    return;
  }

  if (!image) return;
  if (vehicles.some((vehicle) => vehicle.image === image || vehicle.images?.includes(image))) return;

  if (await deleteVehiclePhoto(image)) return;

  if (!String(image).startsWith("/uploads/")) return;

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

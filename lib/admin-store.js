import fs from "node:fs/promises";
import path from "node:path";
import { inventory, vehicleBodyTypes } from "../app/data/vehicles.js";
import {
  countSupabaseAdminUsers,
  createSupabaseAdminUser,
  findSupabaseAdminUser,
  isSupabaseConfigured,
  readSupabaseVehicles,
  scheduleVehiclePhotoDeletion
} from "./supabase-store.js";

const DB_PATH = path.join(process.cwd(), "data", "admin-db.json");
const VEHICLE_FUELS = ["Diesel", "Gasoline", "Hybrid"];
const VEHICLE_TRANSMISSIONS = ["Automatic", "Manual"];
const VEHICLE_STATUSES = ["Available", "Reserved", "Sold"];
const VEHICLE_SEATS = [2, 4, 5, 6, 7, 8, 10, 12, 15];

function createInitialDb() {
  return {
    users: [],
    vehicles: inventory.map((vehicle) => ({ ...vehicle })),
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
    updatedAt: db.updatedAt || null
  };
}

export async function readDb() {
  if (!isSupabaseConfigured()) {
    return readLocalDb();
  }

  const supabaseVehicles = await readSupabaseVehicles();
  const fallbackDb = createInitialDb();
  const vehicles = supabaseVehicles === null ? fallbackDb.vehicles : supabaseVehicles;

  return {
    ...fallbackDb,
    vehicles: vehicles.map((vehicle) => normalizeVehicle(vehicle))
  };
}

export async function readAdminDb() {
  if (!isSupabaseConfigured()) {
    return readLocalDb();
  }

  const supabaseVehicles = await readSupabaseVehicles({ throwOnError: true });

  return {
    ...createInitialDb(),
    vehicles: supabaseVehicles.map((vehicle) => normalizeVehicle(vehicle)),
    updatedAt: new Date().toISOString()
  };
}

export async function writeDb(db) {
  const nextDb = {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle)) : [],
    updatedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    throw new Error("Bulk vehicle writes are disabled when Supabase is configured.");
  }

  return writeLocalDb(nextDb);
}

export async function writeLocalDb(db) {
  const nextDb = {
    users: Array.isArray(db.users) ? db.users : [],
    vehicles: Array.isArray(db.vehicles) ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle)) : [],
    updatedAt: db.updatedAt || new Date().toISOString()
  };

  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(nextDb, null, 2));
  return nextDb;
}

export async function countAdminUsers() {
  if (isSupabaseConfigured()) {
    return countSupabaseAdminUsers();
  }

  return (await readLocalDb()).users.length;
}

export async function findAdminUser(username) {
  const normalizedUsername = String(username || "").trim().toLowerCase();

  if (isSupabaseConfigured()) {
    return findSupabaseAdminUser(normalizedUsername);
  }

  const db = await readLocalDb();
  return db.users.find(
    (user) => String(user.username || "").trim().toLowerCase() === normalizedUsername
  ) || null;
}

export async function createAdminUser(user) {
  const normalizedUser = {
    ...user,
    username: String(user.username || "").trim().toLowerCase()
  };

  if (isSupabaseConfigured()) {
    return createSupabaseAdminUser(normalizedUser);
  }

  const db = await readLocalDb();
  if (db.users.length) {
    throw new Error("Admin setup has already been completed.");
  }

  await writeLocalDb({ ...db, users: [normalizedUser] });
  return normalizedUser;
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

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function normalizeVehicle(input) {
  const name = String(input.name || "").trim();
  const id = makeSlug(input.id || name);
  const status = ["Available", "Reserved", "Sold"].includes(input.status) ? input.status : "Available";
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
    status,
    soldDate: status === "Sold" ? normalizeDate(input.soldDate || input.sold_date) : "",
    image: images[0] || "",
    images,
    accent: String(input.accent || "#8f1d24").trim(),
    description: String(input.description || "").trim(),
    financing: normalizeFinancing(input)
  };
}

export function validateVehicleInput(input) {
  const errors = [];
  const name = String(input?.name || "").trim();
  const type = String(input?.type || "").trim();
  const year = parseNumber(input?.year);
  const price = parseNumber(input?.price);
  const mileage = parseNumber(input?.mileage);
  const fuel = String(input?.fuel || "").trim();
  const transmission = String(input?.transmission || "").trim();
  const seats = parseNumber(input?.seats);
  const status = String(input?.status || "").trim();
  const soldDate = normalizeDate(input?.soldDate || input?.sold_date);
  const images = Array.from(new Set([
    ...(Array.isArray(input?.images) ? input.images : []),
    input?.image
  ].map((image) => String(image || "").trim()).filter(Boolean)));
  const financing = normalizeFinancing(input || {});
  const maximumYear = new Date().getFullYear() + 1;

  if (!name || name.length > 120) errors.push("Vehicle name must be between 1 and 120 characters.");
  if (!vehicleBodyTypes.includes(type)) errors.push("Select a valid vehicle type.");
  if (!Number.isInteger(year) || year < 1950 || year > maximumYear) {
    errors.push(`Vehicle year must be between 1950 and ${maximumYear}.`);
  }
  if (price <= 0) errors.push("Vehicle price must be greater than zero.");
  if (mileage < 0) errors.push("Mileage cannot be negative.");
  if (!VEHICLE_FUELS.includes(fuel)) errors.push("Select a valid fuel type.");
  if (!VEHICLE_TRANSMISSIONS.includes(transmission)) errors.push("Select a valid transmission.");
  if (!VEHICLE_SEATS.includes(seats)) errors.push("Select a valid seat count.");
  if (!VEHICLE_STATUSES.includes(status)) errors.push("Select a valid vehicle status.");
  if (status === "Sold" && !soldDate) errors.push("A valid sold date is required for sold vehicles.");
  if (!images.length) errors.push("Upload at least one vehicle photo.");
  if (images.length > 20) errors.push("A vehicle can have at most 20 photos.");
  if (financing.downPayment <= 0) errors.push("Down payment must be greater than zero.");
  if (financing.downPayment > price) errors.push("Down payment cannot exceed the vehicle price.");
  if (financing.terms.some((term) => term.monthlyPayment <= 0)) {
    errors.push("Enter a monthly payment greater than zero for every financing term.");
  }
  if (String(input?.description || "").length > 2000) {
    errors.push("Description must be 2,000 characters or fewer.");
  }

  return errors;
}

export async function deleteUploadedImageIfUnused(image, vehicles) {
  if (Array.isArray(image)) {
    const unusedImages = image.filter(
      (item) => item && !vehicles.some(
        (vehicle) => vehicle.image === item || vehicle.images?.includes(item)
      )
    );

    if (await scheduleVehiclePhotoDeletion(unusedImages, { resetDelay: true })) return;
    await Promise.all(unusedImages.map((item) => deleteLocalUpload(item)));
    return;
  }

  if (!image) return;
  if (vehicles.some((vehicle) => vehicle.image === image || vehicle.images?.includes(image))) return;

  if (await scheduleVehiclePhotoDeletion(image, { resetDelay: true })) return;
  await deleteLocalUpload(image);
}

async function deleteLocalUpload(image) {
  if (!String(image).startsWith("/uploads/")) return;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, path.basename(image));
  const resolvedUploadDir = path.resolve(uploadDir);
  const resolvedFilePath = path.resolve(filePath);

  if (!resolvedFilePath.startsWith(`${resolvedUploadDir}${path.sep}`)) return;

  try {
    await fs.unlink(resolvedFilePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

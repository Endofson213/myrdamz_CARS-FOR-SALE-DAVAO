import fs from "node:fs/promises";
import path from "node:path";
import { syncSupabaseVehicles } from "../lib/supabase-store.js";

const root = process.cwd();
const dbPath = path.join(root, "data", "admin-db.json");
const envPath = path.join(root, ".env.local");
const vehicleBodyTypes = [
  "SUV",
  "Crossover",
  "MPV/AUV",
  "Sedan",
  "Hatchback",
  "Pickup",
  "Van",
  "Sports Car",
  "Commercial"
];

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

function makeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function normalizeVehicle(input) {
  const name = String(input.name || "").trim();
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
    id: makeSlug(input.id || name),
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
    financing: input.financing || { downPayment: 0, terms: [] }
  };
}

await loadLocalEnv();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  console.error("Add them to .env.local, then run npm run seed:supabase again.");
  process.exit(1);
}

const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
const vehicles = Array.isArray(db.vehicles)
  ? db.vehicles.map((vehicle) => normalizeVehicle(vehicle))
  : [];

if (!vehicles.length) {
  console.log("No vehicles found in data/admin-db.json.");
  process.exit(0);
}

await syncSupabaseVehicles(vehicles);
console.log(`Seeded ${vehicles.length} vehicles to Supabase.`);

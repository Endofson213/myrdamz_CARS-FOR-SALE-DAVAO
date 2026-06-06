import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const files = [
  path.join(root, "data", "admin-db.json"),
  path.join(root, "app", "data", "static-vehicles.json")
];

function parseAmount(value) {
  const normalized = String(value || "").replace(/,/g, "").trim();
  const multiplier = /k$/i.test(normalized) ? 1000 : 1;
  const amount = Number(normalized.replace(/k$/i, "")) * multiplier;
  return Number.isFinite(amount) ? amount : 0;
}

function parseFinancing(description) {
  const lines = String(description || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const downPaymentMatch = lines
    .map((line) => line.match(/\bDP\s*-\s*(?:DP\s*)?([\d,.]+\s*k?)/i))
    .find(Boolean);
  const parsedTerms = lines.flatMap((line) => {
    const match = line.match(/^(\d+)(?:\s*months?)?\s*-\s*([\d,.]+)/i);
    if (!match) return [];

    const rawTerm = Number(match[1]);
    const years = rawTerm >= 12 ? rawTerm / 12 : rawTerm;
    if (!Number.isInteger(years) || years < 1 || years > 5) return [];

    return [{ years, monthlyPayment: parseAmount(match[2]) }];
  });

  return {
    downPayment: downPaymentMatch ? parseAmount(downPaymentMatch[1]) : 0,
    terms: [2, 3, 4, 5].map((years) => ({
      years,
      monthlyPayment: parsedTerms.find((term) => term.years === years)?.monthlyPayment || 0
    }))
  };
}

function migrateVehicle(vehicle) {
  if (vehicle.financing?.terms?.length) return vehicle;
  return { ...vehicle, financing: parseFinancing(vehicle.description) };
}

for (const file of files) {
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  const isDatabase = !Array.isArray(data);
  const vehicles = isDatabase ? data.vehicles : data;
  const migrated = vehicles.map(migrateVehicle);
  const output = isDatabase ? { ...data, vehicles: migrated } : migrated;

  await fs.writeFile(file, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Migrated ${migrated.length} vehicles in ${path.relative(root, file)}`);
}

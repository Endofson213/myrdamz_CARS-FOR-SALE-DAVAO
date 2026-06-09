import staticVehicles from "./static-vehicles.json";

export const inventory = staticVehicles;

export const vehicleBodyTypes = [
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

export const bodyTypes = ["All", ...vehicleBodyTypes];

export function getAssetPath(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

export function formatPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  })
    .format(value)
    .replace("PHP", "PHP ");
}

export function formatMileage(value) {
  return `${new Intl.NumberFormat("en-PH").format(value)} km`;
}

import { notFound } from "next/navigation";
import { inventory } from "../../data/vehicles";
import { readDb } from "../../../lib/admin-store";
import ProductPageClient from "./product-page-client";

async function getVehicles() {
  if (process.env.NEXT_PUBLIC_GITHUB_PAGES === "true") {
    return inventory;
  }

  try {
    const db = await readDb();
    return db.vehicles.length ? db.vehicles : inventory;
  } catch {
    return inventory;
  }
}

function getRelatedVehicles(vehicle, vehicles, count = 3) {
  return vehicles
    .filter((item) => item.id !== vehicle.id)
    .sort((a, b) => {
      const aScore = Number(a.type === vehicle.type) + Number(a.fuel === vehicle.fuel);
      const bScore = Number(b.type === vehicle.type) + Number(b.fuel === vehicle.fuel);
      return bScore - aScore;
    })
    .slice(0, count);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const vehicles = await getVehicles();
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    return {
      title: "Vehicle Not Found | Myrdamz Cars for Sales Davao"
    };
  }

  return {
    title: `${vehicle.name} | Myrdamz Cars for Sales Davao`,
    description: `${vehicle.name} listed at ${vehicle.price.toLocaleString("en-PH")} PHP. ${vehicle.description}`
  };
}

export default async function VehicleProductPage({ params }) {
  const { id } = await params;
  const vehicles = await getVehicles();
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    notFound();
  }

  return <ProductPageClient vehicle={vehicle} related={getRelatedVehicles(vehicle, vehicles)} />;
}

export function generateStaticParams() {
  return inventory.map((vehicle) => ({ id: vehicle.id }));
}

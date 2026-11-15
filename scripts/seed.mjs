import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = new URL(process.env.DATABASE_URL);
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function upsertFuelType(data) {
  return prisma.fuel_types.upsert({
    where: { fuel_name: data.fuel_name },
    update: { price_per_liter: data.price_per_liter, description: data.description, status: data.status },
    create: data,
  });
}

async function upsertPump(data) {
  const existing = await prisma.oil_pumps.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.oil_pumps.update({
      where: { pump_id: existing.pump_id },
      data,
    });
  }
  return prisma.oil_pumps.create({ data });
}

async function upsertInventory(pump_id, fuel_type_id, quantity) {
  return prisma.fuel_inventory.upsert({
    where: { pump_id_fuel_type_id: { pump_id, fuel_type_id } },
    update: { quantity },
    create: { pump_id, fuel_type_id, quantity },
  });
}

async function main() {
  console.log("🌱 Seeding demo data...");

  // Fuel types (BD market prices)
  const fuelTypes = await Promise.all([
    upsertFuelType({ fuel_name: "Petrol", price_per_liter: 122.00, description: "Octane 95", status: "ACTIVE" }),
    upsertFuelType({ fuel_name: "Diesel", price_per_liter: 108.00, description: "Euro 5", status: "ACTIVE" }),
    upsertFuelType({ fuel_name: "Octane 97", price_per_liter: 128.00, description: "Premium", status: "ACTIVE" }),
  ]);
  console.log(`  ✓ ${fuelTypes.length} fuel types`);

  // Pumps around Dhaka
  const pumps = await Promise.all([
    upsertPump({
      name: "Bashundhara Fuel Point",
      address: "Bashundhara R/A, Dhaka",
      contact: "+880-2-5555-1111",
      latitude: 23.8278,
      longitude: 90.4321,
      status: "ACTIVE",
    }),
    upsertPump({
      name: "Gulshan Petroleum",
      address: "Gulshan-1, Dhaka",
      contact: "+880-2-5555-2222",
      latitude: 23.7808,
      longitude: 90.4078,
      status: "ACTIVE",
    }),
    upsertPump({
      name: "Dhanmondi Oil Depot",
      address: "Dhanmondi 27, Dhaka",
      contact: "+880-2-5555-3333",
      latitude: 23.7465,
      longitude: 90.3760,
      status: "ACTIVE",
    }),
    upsertPump({
      name: "Uttara Fuel Center",
      address: "Uttara Sector-7, Dhaka",
      contact: "+880-2-5555-4444",
      latitude: 23.8759,
      longitude: 90.3795,
      status: "ACTIVE",
    }),
  ]);
  console.log(`  ✓ ${pumps.length} pumps`);

  // Inventory: realistic quantities (some low-stock for demo)
  const inventoryOps = [];
  for (const pump of pumps) {
    for (const ft of fuelTypes) {
      let qty = 5000;
      // Make one low-stock item per pump for demo
      if (pump.name === "Uttara Fuel Center" && ft.fuel_name === "Octane 97") {
        qty = 50; // below LOW_STOCK_THRESHOLD (100)
      } else if (pump.name === "Dhanmondi Oil Depot" && ft.fuel_name === "Diesel") {
        qty = 800; // above threshold
      }
      inventoryOps.push(upsertInventory(pump.pump_id, ft.fuel_type_id, qty));
    }
  }
  await Promise.all(inventoryOps);
  console.log(`  ✓ ${inventoryOps.length} inventory records`);

  console.log("\n✅ Seed complete.");
  console.log("Next steps:");
  console.log("  1. Sign up a user in the UI");
  console.log("  2. Promote to admin: npx tsx scripts/promote-admin.mjs <email>");
  console.log("  3. Create pumps/fuel-types via admin UI if needed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
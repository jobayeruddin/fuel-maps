import { headers } from "next/headers";

import InventoryPageClient, { type InventoryItem } from "./InventoryPageClient";

import { getSessionUser, getOperatorPumpId } from "@/lib/authorization";
import { requireOperatorPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";

export default async function OperatorInventoryPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);
  const session = { user };

  requireOperatorPage(session);
  const pumpId = await getOperatorPumpId(session);

  const pump = await prisma.oil_pumps.findUnique({
    where: { pump_id: pumpId },
    select: { pump_id: true, name: true },
  });

  const inventory = await prisma.fuel_inventory.findMany({
    where: { pump_id: pumpId },
    orderBy: { fuel_types: { fuel_name: "asc" } },
    include: {
      fuel_types: {
        select: {
          fuel_type_id: true,
          fuel_name: true,
          price_per_liter: true,
          status: true,
        },
      },
    },
  });

  const items: InventoryItem[] = inventory.map((inv: any) => ({
    inventory_id: inv.inventory_id,
    fuel_type_id: inv.fuel_types.fuel_type_id,
    fuel_name: inv.fuel_types.fuel_name,
    price_per_liter: Number(inv.fuel_types.price_per_liter),
    status: inv.fuel_types.status,
    quantity: Number(inv.quantity),
  }));

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <InventoryPageClient items={items} pumpName={pump?.name || "Pump"} />
    </section>
  );
}

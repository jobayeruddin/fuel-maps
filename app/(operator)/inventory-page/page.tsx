import { headers } from "next/headers";

import { getSessionUser, getOperatorPumpId } from "@/lib/authorization";
import { requireOperatorPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

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

  const lowStockItems = inventory.filter(
    (inv: any) => inv.quantity < LOW_STOCK_THRESHOLD,
  );

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Operator / Inventory
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            {pump?.name || "Pump"} Inventory
          </h1>
        </div>
        {lowStockItems.length > 0 && (
          <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            {lowStockItems.length} Low Stock Item(s)
          </span>
        )}
      </div>

      {inventory.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">
            No inventory configured for this pump.
          </p>
          <p className="text-sm text-text-secondary">
            Contact admin to set up fuel types and stock.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inventory.map((inv: any) => (
            <div
              key={inv.inventory_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-mono text-lg font-medium">
                  {inv.fuel_types.fuel_name}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  ${Number(inv.fuel_types.price_per_liter)}/L •{" "}
                  {inv.fuel_types.status}
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="text-right">
                  <p className="font-mono text-2xl font-medium">
                    {Number(inv.quantity)} L
                  </p>
                  <p className="text-xs text-text-secondary">
                    ${Number(inv.fuel_types.price_per_liter)}/L
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inv.quantity < LOW_STOCK_THRESHOLD && (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                      Low Stock
                    </span>
                  )}
                  {inv.fuel_types.status === "INACTIVE" && (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-text-secondary/20 text-text-secondary">
                      Inactive
                    </span>
                  )}
                  {inv.quantity >= LOW_STOCK_THRESHOLD &&
                    inv.fuel_types.status === "ACTIVE" && (
                      <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        OK
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default async function AdminInventoryPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const inventory = await prisma.fuel_inventory.findMany({
    orderBy: [
      { oil_pumps: { name: "asc" } },
      { fuel_types: { fuel_name: "asc" } },
    ],
    include: {
      oil_pumps: { select: { pump_id: true, name: true, status: true } },
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
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Inventory
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Fuel Inventory
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {lowStockItems.length > 0 && (
            <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
              {lowStockItems.length} Low Stock
            </span>
          )}
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            href="/inventory/new"
          >
            Receive Stock
          </a>
          <a
            className="inline-flex items-center rounded-pill bg-primary/20 text-primary px-6 py-2 text-sm font-medium hover:bg-primary/30 transition-colors"
            href="/inventory/adjust"
          >
            Adjust Stock
          </a>
          <a
            className="inline-flex items-center rounded-pill bg-text-secondary/20 text-text-secondary px-6 py-2 text-sm font-medium hover:bg-text-secondary/30 transition-colors"
            href="/inventory/history"
          >
            History
          </a>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Pump
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Fuel Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Price/L
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Quantity (L)
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inventory.map((inv: any) => (
              <tr key={inv.inventory_id} className="hover:bg-background/50">
                <td className="px-6 py-4">
                  <p className="font-medium">{inv.oil_pumps.name}</p>
                  <p className="text-xs text-text-secondary">
                    {inv.oil_pumps.status}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium">{inv.fuel_types.fuel_name}</p>
                  <p className="text-xs text-text-secondary">
                    ${Number(inv.fuel_types.price_per_liter)}/L
                  </p>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm">
                  ${Number(inv.fuel_types.price_per_liter)}
                </td>
                <td className="px-6 py-4 text-right font-mono text-lg">
                  {Number(inv.quantity)} L
                </td>
                <td className="px-6 py-4 text-right">
                  {inv.quantity < LOW_STOCK_THRESHOLD ? (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600">
                      Low Stock
                    </span>
                  ) : inv.fuel_types.status === "INACTIVE" ||
                    inv.oil_pumps.status === "INACTIVE" ? (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-text-secondary/20 text-text-secondary">
                      Inactive
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-500/20 text-green-600">
                      OK
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm text-text-secondary">
                  {new Date(inv.last_updated).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inventory.length === 0 && (
        <div className="rounded-card bg-surface border border-border p-12 text-center mt-4">
          <p className="text-text-secondary mb-4">
            No inventory records found.
          </p>
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            href="/inventory/new"
          >
            Receive First Stock
          </a>
        </div>
      )}
    </section>
  );
}

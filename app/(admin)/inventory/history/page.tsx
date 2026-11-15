import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";

export default async function InventoryHistoryPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const movements = await prisma.inventoryTransaction.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    include: {
      pump: { select: { name: true } },
      fuel_type: { select: { fuel_name: true } },
      actor: { select: { name: true, email: true } },
      transaction: { select: { transaction_id: true } },
    },
  });

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Inventory
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Inventory Movement History
          </h1>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Pump
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Fuel Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Change
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Actor
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((m: any) => (
              <tr key={m.movement_id} className="hover:bg-background/50">
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {new Date(m.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium">{m.pump.name}</td>
                <td className="px-6 py-4">{m.fuel_type.fuel_name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${
                      m.movement_type === "STOCK_IN"
                        ? "bg-green-500/20 text-green-400"
                        : m.movement_type === "DISPENSE"
                          ? "bg-primary/20 text-primary"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {m.movement_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {Number(m.quantity_change) > 0 ? "+" : ""}
                  {Number(m.quantity_change)} L
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm">
                  {m.resulting_balance !== null
                    ? Number(m.resulting_balance) + " L"
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {m.actor.name} ({m.actor.email})
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                  {m.remarks ||
                    (m.transaction_id
                      ? `Transaction #${m.transaction.transaction_id}`
                      : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {movements.length === 0 && (
        <div className="rounded-card bg-surface border border-border p-12 text-center mt-4">
          <p className="text-text-secondary">
            No inventory movements recorded yet.
          </p>
        </div>
      )}
    </section>
  );
}

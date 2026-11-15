import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import { getAdminReportData } from "@/lib/reports";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const params = (await searchParams) as Record<string, string>;
  const from = params["from"] || undefined;
  const to = params["to"] || undefined;
  const pump_id = params["pump_id"] || undefined;
  const fuel_type_id = params["fuel_type_id"] || undefined;
  const operator_id = params["operator_id"] || undefined;

  const [pumps, fuelTypes, operators, report] = await Promise.all([
    prisma.oil_pumps.findMany({
      select: { pump_id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.fuel_types.findMany({
      select: { fuel_type_id: true, fuel_name: true },
      orderBy: { fuel_name: "asc" },
    }),
    prisma.operator.findMany({
      where: { status: "ACTIVE" },
      select: { operator_id: true, user: { select: { name: true } } },
    }),
    getAdminReportData({ from, to, pump_id, fuel_type_id, operator_id }),
  ]);

  const avgPerTxn = report.totalTransactions
    ? report.totalRevenue / report.totalTransactions
    : 0;

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Reports
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Reports & Analytics
          </h1>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border p-6 mb-6">
        <form
          className="grid gap-4 md:grid-cols-5"
          id="report-filters"
          method="GET"
        >
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Pump
            </span>
            <select
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={pump_id || ""}
              name="pump_id"
            >
              <option value="">All Pumps</option>
              {pumps.map((p: any) => (
                <option key={p.pump_id} value={p.pump_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Fuel Type
            </span>
            <select
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={fuel_type_id || ""}
              name="fuel_type_id"
            >
              <option value="">All Types</option>
              {fuelTypes.map((f: any) => (
                <option key={f.fuel_type_id} value={f.fuel_type_id}>
                  {f.fuel_name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Operator
            </span>
            <select
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={operator_id || ""}
              name="operator_id"
            >
              <option value="">All Operators</option>
              {operators.map((o: any) => (
                <option key={o.operator_id} value={o.operator_id}>
                  {o.user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-xs text-text-secondary uppercase">
              From Date
            </span>
            <input
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={from || ""}
              name="from"
              type="date"
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-1">
            <span className="font-mono text-xs text-text-secondary uppercase">
              To Date
            </span>
            <input
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={to || ""}
              name="to"
              type="date"
            />
          </label>
        </form>

        <div className="mt-4 flex gap-3">
          <button
            className="inline-flex items-center rounded-pill bg-primary px-5 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            form="report-filters"
            type="submit"
          >
            Apply Filters
          </button>
          <a
            className="inline-flex items-center rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
            href="/reports"
          >
            Reset Filters
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-card bg-surface border border-border p-6">
          <p className="font-mono text-xs text-text-secondary uppercase">
            Total Volume
          </p>
          <p className="mt-2 text-3xl font-medium">
            {report.totalVolume.toLocaleString()} L
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-6">
          <p className="font-mono text-xs text-text-secondary uppercase">
            Total Revenue
          </p>
          <p className="mt-2 text-3xl font-medium text-primary">
            $
            {report.totalRevenue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-6">
          <p className="font-mono text-xs text-text-secondary uppercase">
            Transactions
          </p>
          <p className="mt-2 text-3xl font-medium">
            {report.totalTransactions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-card bg-surface border border-border p-6">
          <p className="font-mono text-xs text-text-secondary uppercase">
            Avg / Transaction
          </p>
          <p className="mt-2 text-3xl font-medium">${avgPerTxn.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="rounded-card bg-surface border border-border p-6 md:col-span-2">
          <h2 className="text-lg font-medium mb-4">Consumption by Fuel Type</h2>
          <div className="space-y-3">
            {report.totalByType.length === 0 ? (
              <p className="text-text-secondary">
                No transactions for these filters.
              </p>
            ) : (
              report.totalByType.map((t: any) => (
                <div
                  key={t.fuel_type_id}
                  className="p-3 rounded-control bg-background border border-border"
                >
                  <p className="font-medium">{t.fuel_name}</p>
                  <p className="text-sm text-text-secondary">
                    {t.quantity.toLocaleString()} L · {t.transactions} txns · $
                    {t.revenue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6 md:col-span-2">
          <h2 className="text-lg font-medium mb-4">Consumption by Pump</h2>
          <div className="space-y-3">
            {report.totalByPump.length === 0 ? (
              <p className="text-text-secondary">
                No transactions for these filters.
              </p>
            ) : (
              report.totalByPump.map((t: any) => (
                <div
                  key={t.pump_id}
                  className="p-3 rounded-control bg-background border border-border"
                >
                  <p className="font-medium">{t.pump_name}</p>
                  <p className="text-sm text-text-secondary">
                    {t.quantity.toLocaleString()} L · {t.transactions} txns · $
                    {t.revenue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Current Inventory</h2>
          <div className="space-y-3">
            {report.inventory.length === 0 ? (
              <p className="text-text-secondary">No inventory records.</p>
            ) : (
              report.inventory.map((i: any) => (
                <div
                  key={i.inventory_id}
                  className="p-3 rounded-control bg-background border border-border"
                >
                  <p className="font-medium">
                    {i.oil_pumps.name} - {i.fuel_types.fuel_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {Number(i.quantity).toLocaleString()} L ·{" "}
                    {i.fuel_types.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Low Stock</h2>
          <div className="space-y-3">
            {report.lowStock.length === 0 ? (
              <p className="text-sm text-text-secondary">No low stock items</p>
            ) : (
              report.lowStock.map((i: any) => (
                <div
                  key={i.inventory_id}
                  className="p-3 rounded-control bg-background border border-yellow-500/20 text-yellow-600"
                >
                  <p className="font-medium">
                    {i.oil_pumps.name} - {i.fuel_types.fuel_name}
                  </p>
                  <p className="text-sm">
                    {Number(i.quantity).toLocaleString()} L remaining
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

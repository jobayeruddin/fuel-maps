import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const params = (await searchParams) as Record<string, string>;
  const page = Math.max(1, parseInt(params["page"] || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(params["limit"] || "20")));
  const skip = (page - 1) * limit;
  const q = (params["q"] || "").trim();
  const pumpId = params["pump_id"];
  const fuelTypeId = params["fuel_type_id"];
  const operatorId = params["operator_id"];
  const from = params["from"];
  const to = params["to"];

  const buildPageHref = (targetPage: number) => {
    const sp = new URLSearchParams();

    sp.set("page", String(targetPage));
    sp.set("limit", String(limit));
    if (q) sp.set("q", q);
    if (pumpId) sp.set("pump_id", pumpId);
    if (fuelTypeId) sp.set("fuel_type_id", fuelTypeId);
    if (operatorId) sp.set("operator_id", operatorId);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);

    return `/admin/transactions?${sp.toString()}`;
  };

  const where: Record<string, any> = {};

  if (pumpId) where.pump_id = parseInt(pumpId);
  if (fuelTypeId) where.fuel_type_id = parseInt(fuelTypeId);
  if (operatorId) where.operator_id = parseInt(operatorId);
  if (from || to) {
    where.dispensed_at = {};
    if (from) where.dispensed_at.gte = new Date(from);
    if (to) {
      const end = new Date(to);

      end.setHours(23, 59, 59, 999);
      where.dispensed_at.lte = end;
    }
  }
  if (q) {
    where.user = { name: { contains: q } };
  }

  const [rows, total, pumps, fuelTypes, operators] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dispensed_at: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { registration_number: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
        operator: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
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
  ]);

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Transactions
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Transaction History
          </h1>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border p-6 mb-6">
        <form
          className="grid gap-4 md:grid-cols-5"
          id="txn-filters"
          method="GET"
        >
          <input name="limit" type="hidden" value={limit} />
          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Search (user name)
            </span>
            <input
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
              defaultValue={q}
              name="q"
              placeholder="Search by user name"
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Pump
            </span>
            <select
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={pumpId || ""}
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

          <label className="flex flex-col gap-2">
            <span className="font-mono text-xs text-text-secondary uppercase">
              Fuel Type
            </span>
            <select
              className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary"
              defaultValue={fuelTypeId || ""}
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

          <label className="flex flex-col gap-2">
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

          <label className="flex flex-col gap-2">
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
            form="txn-filters"
            type="submit"
          >
            Apply Filters
          </button>
          <a
            className="inline-flex items-center rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
            href="/transactions"
          >
            Reset Filters
          </a>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Date / Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Pump
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Fuel Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Quantity (L)
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-mono text-text-secondary uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Operator
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-12 text-center text-text-secondary"
                  colSpan={9}
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              rows.map((t: any) => (
                <tr key={t.transaction_id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(t.dispensed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{t.user.name}</p>
                    <p className="text-xs text-text-secondary">
                      {t.user.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {t.vehicle.registration_number}
                  </td>
                  <td className="px-6 py-4 font-medium">{t.pump.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {t.fuel_type.fuel_name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">
                    {Number(t.quantity).toLocaleString()} L
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">
                    ${Number(t.unit_price).toFixed(2)}/L
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-medium">
                    $
                    {Number(t.total_amount).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {t.operator.user.name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Showing {total === 0 ? 0 : (page - 1) * limit + 1}–
          {Math.min(page * limit, total)} of {total} transactions
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              className="rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
              href={buildPageHref(page - 1)}
            >
              Previous
            </a>
          )}
          {page * limit < total && (
            <a
              className="rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
              href={buildPageHref(page + 1)}
            >
              Next
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

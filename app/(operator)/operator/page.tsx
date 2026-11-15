import { headers } from "next/headers";

import {
  getSessionUser,
  getOperatorPumpId,
  getOperatorDashboardData,
} from "@/lib/authorization";
import { requireOperatorPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default async function OperatorDashboardPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);
  const session = { user };

  requireOperatorPage(session);
  const pumpId = await getOperatorPumpId(session);
  const operatorRecord = await prisma.operator.findUnique({
    where: { user_id: user.id },
    select: { operator_id: true, pump_id: true },
  });
  const operatorId = operatorRecord?.operator_id;
  const dashboardData = await getOperatorDashboardData(pumpId, operatorId);

  if (!dashboardData) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Operator not found</p>
      </section>
    );
  }

  const totalVolume = Number(dashboardData.pumpStats?._sum.quantity || 0);
  const totalRevenue = Number(dashboardData.pumpStats?._sum.total_amount || 0);

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Operator Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-medium tracking-tight">
              Hello, {user.name}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Pump: {dashboardData.operator.pump.name}
            </p>
          </div>
          {/* <form action="/api/auth/sign-out" method="POST">
            <button className="rounded-pill border border-border px-6 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Logout
            </button>
          </form> */}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Pending Requests
            </p>
            <p className="mt-2 text-3xl font-medium text-yellow-400">
              {dashboardData.pendingRequests.length}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Volume Dispensed
            </p>
            <p className="mt-2 text-3xl font-medium">
              {totalVolume.toLocaleString()} L
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-medium text-primary">
              $
              {totalRevenue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Fuel Types
            </p>
            <p className="mt-2 text-3xl font-medium">
              {dashboardData.inventory.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-card bg-surface border border-border p-6">
              <h2 className="text-lg font-medium mb-4">
                Pending Requests ({dashboardData.pendingRequests.length})
              </h2>
              {dashboardData.pendingRequests.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No pending requests
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.pendingRequests.map((r: any) => (
                    <div
                      key={r.request_id}
                      className="p-3 rounded-control bg-background border border-border"
                    >
                      <p className="font-medium">
                        {r.fuel_type.fuel_name} - {Number(r.quantity)}L
                      </p>
                      <p className="text-sm text-text-secondary">
                        {r.user.name} - {r.vehicle.registration_number}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <a
                          className="px-3 py-1 text-xs text-primary hover:underline"
                          href={`/operator/requests/${r.request_id}`}
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-card bg-surface border border-border p-6">
              <h2 className="text-lg font-medium mb-4">
                Approved — Ready to Dispense (
                {dashboardData.approvedRequests.length})
              </h2>
              {dashboardData.approvedRequests.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No approved requests
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.approvedRequests.map((r: any) => (
                    <div
                      key={r.request_id}
                      className="p-3 rounded-control bg-background border border-border"
                    >
                      <p className="font-medium">
                        {r.fuel_type.fuel_name} - {Number(r.quantity)}L
                      </p>
                      <p className="text-sm text-text-secondary">
                        {r.user.name} - {r.vehicle.registration_number}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <a
                          className="px-3 py-1 text-xs text-primary hover:underline"
                          href={`/operator/requests/${r.request_id}`}
                        >
                          Dispense
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Pump Inventory</h2>
            {dashboardData.inventory.length === 0 ? (
              <p className="text-sm text-text-secondary">No inventory data</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.inventory.map((inv: any) => (
                  <div
                    key={inv.inventory_id}
                    className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
                  >
                    <div>
                      <p className="font-medium">{inv.fuel_types.fuel_name}</p>
                      <p className="text-sm text-text-secondary">
                        ${Number(inv.fuel_types.price_per_liter)}/L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg">
                        {Number(inv.quantity)} L
                      </p>
                      {inv.quantity < LOW_STOCK_THRESHOLD && (
                        <span className="text-xs font-mono px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Recent Dispensing</h2>
          {dashboardData.recentDispensing.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No recent dispensing activity
            </p>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentDispensing.map((t: any) => (
                <div
                  key={t.transaction_id}
                  className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
                >
                  <div>
                    <p className="font-medium">
                      {t.fuel_type.fuel_name} - {Number(t.quantity)}L
                    </p>
                    <p className="text-sm text-text-secondary">
                      {t.user.name} - {t.vehicle.registration_number} - $
                      {Number(t.total_amount)}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-green-400">
                    {new Date(t.dispensed_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

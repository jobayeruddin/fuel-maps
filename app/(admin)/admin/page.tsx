import { headers } from "next/headers";

import { getSessionUser, getAdminDashboardData } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";

function LowStockAlerts({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">No low stock items</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <div
          key={item.inventory_id}
          className="p-3 rounded-control bg-background border border-border"
        >
          <p className="font-medium">{item.fuel_types.fuel_name}</p>
          <p className="text-sm text-text-secondary">
            {item.oil_pumps.name} - {Number(item.quantity)} L remaining
          </p>
        </div>
      ))}
    </div>
  );
}

function RecentRequests({ requests }: { requests: any[] }) {
  return (
    <div className="space-y-3">
      {requests.map((r: any) => (
        <div
          key={r.request_id}
          className="p-3 rounded-control bg-background border border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {r.fuel_type.fuel_name} - {Number(r.quantity)}L
              </p>
              <p className="text-sm text-text-secondary">
                {r.user.name} @ {r.pump.name}
              </p>
            </div>
            <span
              className={`text-xs font-mono px-2 py-1 rounded-full ${
                r.status === "PENDING"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : r.status === "APPROVED"
                    ? "bg-green-500/20 text-green-400"
                    : r.status === "COMPLETED"
                      ? "bg-primary/20 text-primary"
                      : r.status === "REJECTED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-text-secondary/20 text-text-secondary"
              }`}
            >
              {r.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentTransactions({ transactions }: { transactions: any[] }) {
  return (
    <div className="space-y-3">
      {transactions.map((t: any) => (
        <div
          key={t.transaction_id}
          className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
        >
          <div>
            <p className="font-medium">
              {t.fuel_type.fuel_name} - {Number(t.quantity)}L
            </p>
            <p className="text-sm text-text-secondary">
              {t.user.name} @ {t.pump.name} - ${t.total_amount}
            </p>
          </div>
          <span className="text-sm font-mono text-green-400">
            {new Date(t.dispensed_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function TopPumpsByVolume({ pumps }: { pumps: any[] }) {
  if (!pumps || pumps.length === 0) {
    return (
      <p className="text-sm text-text-secondary">No dispensing data yet</p>
    );
  }

  return (
    <div className="space-y-3">
      {pumps.map((p: any, i: number) => (
        <div
          key={p.pump_id}
          className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">
              {i + 1}
            </span>
            <span className="font-medium">{p.pump_name || p.pump_id}</span>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg">
              {Number(p._sum.quantity || 0).toLocaleString()} L
            </p>
            <p className="text-xs text-text-secondary">
              $
              {Number(p._sum.total_amount || 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function VolumeChart({ data }: { data: any[] }) {
  const maxVolume = Math.max(...data.map((d) => d.volume), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="text-xs text-text-secondary w-24">
            {new Date(d.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="flex-1 h-6 bg-background border border-border rounded-control overflow-hidden">
            <div
              className="h-full bg-primary/20 transition-all duration-300"
              style={{ width: `${(d.volume / maxVolume) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-text-secondary w-20 text-right">
            {d.volume.toLocaleString()} L
          </span>
        </div>
      ))}
    </div>
  );
}

function RequestStatusChart({ requestsByStatus }: { requestsByStatus: any[] }) {
  const total = requestsByStatus.reduce((sum, r) => sum + r._count.status, 0);

  if (total === 0)
    return <p className="text-sm text-text-secondary">No requests yet</p>;

  return (
    <div className="space-y-2">
      {requestsByStatus.map((r) => {
        const percentage = (r._count.status / total) * 100;
        const color =
          r.status === "PENDING"
            ? "bg-yellow-400"
            : r.status === "APPROVED"
              ? "bg-green-400"
              : r.status === "COMPLETED"
                ? "bg-primary"
                : r.status === "REJECTED"
                  ? "bg-red-400"
                  : r.status === "CANCELLED"
                    ? "bg-text-secondary"
                    : "bg-text-secondary";

        return (
          <div key={r.status} className="flex items-center gap-3">
            <span className="text-xs font-mono text-text-secondary w-20 capitalize">
              {r.status}
            </span>
            <div className="flex-1 h-4 bg-background border border-border rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-300 rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-secondary w-12 text-right">
              {r._count.status} ({percentage.toFixed(0)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);
  const session = { user };

  requireAdminPage(session);
  const dashboardData = await getAdminDashboardData();

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-medium tracking-tight">
              Hello, {user.name}
            </h1>
          </div>
          <form action="/api/auth/sign-out" method="POST">
            <button className="rounded-pill border border-border px-6 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Logout
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Users
            </p>
            <p className="mt-2 text-3xl font-medium">
              {dashboardData.stats.totalUsers}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Active Operators
            </p>
            <p className="mt-2 text-3xl font-medium">
              {dashboardData.stats.totalOperators}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Volume Dispensed
            </p>
            <p className="mt-2 text-3xl font-medium">
              {Number(
                dashboardData.stats.totalVolumeDispensed,
              ).toLocaleString()}{" "}
              L
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Revenue
            </p>
            <p className="mt-2 text-3xl font-medium text-primary">
              $
              {Number(dashboardData.stats.totalRevenue).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 },
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Active Pumps
            </p>
            <p className="mt-2 text-3xl font-medium">
              {dashboardData.stats.totalPumps}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Pending Requests
            </p>
            <p className="mt-2 text-3xl font-medium text-yellow-400">
              {dashboardData.stats.pendingRequests}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-card bg-surface border border-border p-6 md:col-span-2">
            <h2 className="text-lg font-medium mb-4">
              Request Status Distribution
            </h2>
            <RequestStatusChart
              requestsByStatus={dashboardData.requestsByStatus}
            />
          </div>

          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">
              Low Stock Alerts ({dashboardData.lowStockItems.length})
            </h2>
            <LowStockAlerts items={dashboardData.lowStockItems} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Volume Last 7 Days</h2>
            <VolumeChart data={dashboardData.dailyVolumeLast7Days} />
          </div>

          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Top Pumps by Volume</h2>
            <TopPumpsByVolume pumps={dashboardData.topPumpsByVolume} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Recent Requests</h2>
            <RecentRequests requests={dashboardData.recentRequests} />
          </div>

          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
            <RecentTransactions
              transactions={dashboardData.recentTransactions}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

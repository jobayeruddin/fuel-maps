import { headers } from "next/headers";
import { Suspense } from "react";
import Link from "next/link";

import { getSessionUser, getUserDashboardData } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";
import { Skeleton } from "@/components/ui-states";

function DashboardSkeleton() {
  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <Skeleton className="max-w-xs" lines={2} variant="title" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </section>
  );
}

function DashboardContent({
  user,
  dashboardData,
}: {
  user: any;
  dashboardData: any;
}) {
  const totalRequests =
    dashboardData.requestsByStatus?.reduce(
      (sum: number, r: any) => sum + r._count.status,
      0,
    ) || 0;
  const pendingCount =
    dashboardData.requestsByStatus?.find((r: any) => r.status === "PENDING")
      ?._count.status || 0;
  const dispensedCount =
    dashboardData.requestsByStatus?.find((r: any) => r.status === "COMPLETED")
      ?._count.status || 0;

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-medium tracking-tight">
              Hello, {user.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex items-center rounded-pill border border-border px-6 py-2 text-sm font-medium text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
              href="/nearby"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
                <path
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              Nearby Pumps
            </Link>
            <form action="/api/auth/sign-out" method="POST">
              <button className="rounded-pill border border-border px-6 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Total Requests
            </p>
            <p className="mt-2 text-3xl font-medium">{totalRequests}</p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Pending
            </p>
            <p className="mt-2 text-3xl font-medium text-yellow-400">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Completed
            </p>
            <p className="mt-2 text-3xl font-medium text-green-400">
              {dispensedCount}
            </p>
          </div>
          <div className="rounded-card bg-surface border border-border p-6">
            <p className="font-mono text-xs text-text-secondary uppercase">
              Vehicles
            </p>
            <p className="mt-2 text-3xl font-medium">
              {dashboardData.vehicles.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">
              Your Vehicles ({dashboardData.vehicles.length})
            </h2>
            {dashboardData.vehicles.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-text-secondary mb-4">
                  No vehicles registered yet.
                </p>
                <a
                  className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                  href="/vehicles/new"
                >
                  Register Vehicle
                </a>
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboardData.vehicles.map((v: any) => (
                  <li
                    key={v.vehicle_id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-mono text-sm">
                        {v.registration_number}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {v.vehicle_type || "Unknown type"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono ${v.status === "ACTIVE" ? "text-green-400" : "text-text-secondary"}`}
                    >
                      {v.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-card bg-surface border border-border p-6 md:col-span-2">
            <h2 className="text-lg font-medium mb-4">Recent Fuel Requests</h2>
            {dashboardData.requests.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-text-secondary mb-4">
                  No fuel requests yet.
                </p>
                <Link
                  className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                  href="/requests/new"
                >
                  Create Request
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.requests.map((r: any) => (
                  <div
                    key={r.request_id}
                    className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
                  >
                    <div>
                      <p className="font-medium">
                        {r.fuel_type.fuel_name} - {Number(r.quantity)}L
                      </p>
                      <p className="text-sm text-text-secondary">
                        {r.vehicle.registration_number} @ {r.pump.name}
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
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Transactions</h2>
          </div>
          {dashboardData.transactions.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No completed transactions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {dashboardData.transactions.map((t: any) => (
                <div
                  key={t.transaction_id}
                  className="flex items-center justify-between p-3 rounded-control bg-background border border-border"
                >
                  <div>
                    <p className="font-medium">
                      {t.fuel_type.fuel_name} - {Number(t.quantity)}L
                    </p>
                    <p className="text-sm text-text-secondary">
                      {t.vehicle.registration_number} @ {t.pump.name} - $
                      {Number(t.total_amount)}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-green-400">
                    {new Date(t.dispensed_at).toLocaleDateString()}
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

export default async function UserDashboardPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  const dashboardData = await getUserDashboardData(user.id);

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent dashboardData={dashboardData} user={user} />
      </Suspense>
    </section>
  );
}

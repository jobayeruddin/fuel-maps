import { headers } from "next/headers";
import Link from "next/link";

import { getSessionUser } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function UserRequestsPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  const requests = await prisma.fuelRequest.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    include: {
      vehicle: { select: { registration_number: true } },
      pump: { select: { name: true } },
      fuel_type: { select: { fuel_name: true } },
    },
  });

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Requests
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            My Fuel Requests
          </h1>
        </div>
        <Link
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          href="/requests/new"
        >
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No fuel requests yet.</p>
          <Link
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            href="/requests/new"
          >
            Create Your First Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <div
              key={r.request_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg font-medium">
                    {r.fuel_type.fuel_name} - {Number(r.quantity)}L
                  </p>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${
                      r.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : r.status === "APPROVED"
                          ? "bg-green-500/20 text-green-600"
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
                <p className="mt-1 text-sm text-text-secondary">
                  {r.vehicle.registration_number} @ {r.pump.name} •{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
                {r.remarks && (
                  <p className="mt-1 text-sm text-text-secondary">
                    Remarks: {r.remarks}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="rounded-control border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                  href={`/requests/${r.request_id}`}
                >
                  View
                </a>
                {(r.status === "PENDING" || r.status === "APPROVED") && (
                  <ConfirmForm
                    action="/api/user/requests/cancel"
                    className="rounded-control border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition-colors"
                    confirmMessage="Cancel this request?"
                    inputs={{ name: "requestId", value: r.request_id }}
                    label="Cancel"
                    method="POST"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

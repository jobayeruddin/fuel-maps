import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function AdminPumpsPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const pumps = await prisma.oil_pumps.findMany({
    orderBy: { created_at: "desc" },
    include: {
      operators: {
        include: { user: { select: { name: true, email: true } } },
      },
      fuel_inventory: { include: { fuel_types: true } },
    },
  });

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Pumps
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Manage Pumps
          </h1>
        </div>
        <a
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          href="/pumps/new"
        >
          Add Pump
        </a>
      </div>

      {pumps.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No pumps registered yet.</p>
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            href="/pumps/new"
          >
            Add First Pump
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {pumps.map((pump: any) => (
            <div
              key={pump.pump_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg font-medium">{pump.name}</p>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${pump.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-text-secondary/20 text-text-secondary"}`}
                  >
                    {pump.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {pump.address}{" "}
                  {pump.latitude && pump.longitude
                    ? `• ${pump.latitude}, ${pump.longitude}`
                    : ""}
                </p>
                {pump.operators.length > 0 && (
                  <p className="mt-1 text-sm text-primary">
                    Operator: {pump.operators[0].user.name} (
                    {pump.operators[0].user.email})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="rounded-control border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                  href={`/pumps/${pump.pump_id}/edit`}
                >
                  Edit
                </a>
                <ConfirmForm
                  action="/api/admin/pumps/delete"
                  className="rounded-control border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition-colors"
                  confirmMessage="Delete this pump?"
                  inputs={{ name: "pumpId", value: pump.pump_id }}
                  label="Delete"
                  method="POST"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

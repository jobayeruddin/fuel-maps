import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function AdminFuelTypesPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const fuelTypes = await prisma.fuel_types.findMany({
    orderBy: { fuel_name: "asc" },
    include: { fuel_inventory: true },
  });

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Fuel Types
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Manage Fuel Types
          </h1>
        </div>
        <a
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          href="/fuel-types/new"
        >
          Add Fuel Type
        </a>
      </div>

      {fuelTypes.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No fuel types configured.</p>
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            href="/fuel-types/new"
          >
            Add First Fuel Type
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {fuelTypes.map((ft: any) => (
            <div
              key={ft.fuel_type_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg font-medium">
                    {ft.fuel_name}
                  </p>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${ft.status === "ACTIVE" ? "bg-green-500/20 text-green-600" : "bg-text-secondary/20 text-text-secondary"}`}
                  >
                    {ft.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  ${Number(ft.price_per_liter)}/L •{" "}
                  {ft.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="rounded-control border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                  href={`/fuel-types/${ft.fuel_type_id}/edit`}
                >
                  Edit
                </a>
                <ConfirmForm
                  action="/api/admin/fuel-types/delete"
                  className="rounded-control border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition-colors"
                  confirmMessage="Delete this fuel type?"
                  inputs={{ name: "fuelTypeId", value: ft.fuel_type_id }}
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

import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function VehiclesPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  const vehicles = await prisma.vehicle.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
  });

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Vehicles
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            My Vehicles
          </h1>
        </div>
        <a
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          href="/vehicles/new"
        >
          Register Vehicle
        </a>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">
            No vehicles registered yet.
          </p>
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            href="/vehicles/new"
          >
            Register Your First Vehicle
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v: any) => (
            <div
              key={v.vehicle_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg font-medium">
                    {v.registration_number}
                  </p>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${v.status === "ACTIVE" ? "bg-green-500/20 text-green-600" : "bg-text-secondary/20 text-text-secondary"}`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {v.vehicle_type || "Type not specified"} • Registered{" "}
                  {new Date(v.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="rounded-control border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                  href={`/vehicles/${v.vehicle_id}/edit`}
                >
                  Edit
                </a>
                <ConfirmForm
                  action="/api/user/vehicles/delete"
                  className="rounded-control border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition-colors"
                  confirmMessage="Delete this vehicle?"
                  inputs={{ name: "vehicleId", value: v.vehicle_id }}
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

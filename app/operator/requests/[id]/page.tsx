import { headers } from "next/headers";

import DispenseForm from "./DispenseForm";

import { getSessionUser, getOperatorPumpId } from "@/lib/authorization";
import { requireOperatorPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";

export default async function OperatorRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const user = await getSessionUser(headersList);
  const session = { user };

  requireOperatorPage(session);
  const pumpId = await getOperatorPumpId(session);

  const request = await prisma.fuelRequest.findFirst({
    where: { request_id: parseInt(id), pump_id: pumpId },
    include: {
      user: { select: { name: true, email: true } },
      vehicle: { select: { registration_number: true, vehicle_type: true } },
      pump: { select: { name: true, address: true } },
      fuel_type: { select: { fuel_name: true, price_per_liter: true } },
      reviewer: { select: { name: true } },
    },
  });

  if (!request) {
    return (
      <section className="py-10 px-6 max-w-4xl mx-auto text-center">
        <p className="text-text-secondary">
          Request not found or not in your pump
        </p>
        <a
          className="text-primary hover:underline mt-4 inline-block"
          href="/operator"
        >
          ← Back to dashboard
        </a>
      </section>
    );
  }

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Operator / Requests
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Request #{request.request_id}
          </h1>
        </div>
        <a className="text-primary hover:underline" href="/operator">
          ← Back to dashboard
        </a>
      </div>

      <div className="space-y-6">
        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Request Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Fuel Type
              </p>
              <p className="font-medium">{request.fuel_type.fuel_name}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Price
              </p>
              <p className="font-medium">
                ${Number(request.fuel_type.price_per_liter)}/L
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Quantity
              </p>
              <p className="font-medium">{Number(request.quantity)} L</p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Estimated Total
              </p>
              <p className="font-medium text-primary">
                $
                {(
                  Number(request.fuel_type.price_per_liter) *
                  Number(request.quantity)
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Customer
              </p>
              <p className="font-medium">{request.user.name}</p>
              <p className="text-sm text-text-secondary">
                {request.user.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Vehicle
              </p>
              <p className="font-mono">{request.vehicle.registration_number}</p>
              <p className="text-sm text-text-secondary">
                {request.vehicle.vehicle_type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-text-secondary uppercase">
                Pump
              </p>
              <p className="font-medium">{request.pump.name}</p>
              <p className="text-sm text-text-secondary">
                {request.pump.address}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Status: {request.status}</h2>
          <p className="text-sm text-text-secondary">
            Created: {new Date(request.created_at).toLocaleString()}
            {request.updated_at && (
              <span>
                {" "}
                • Updated: {new Date(request.updated_at).toLocaleString()}
              </span>
            )}
            {request.reviewed_by && request.reviewer && (
              <span> • Reviewed by: {request.reviewer.name}</span>
            )}
          </p>
        </div>

        {request.status === "PENDING" && (
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Verification</h2>
            <p className="text-sm text-text-secondary mb-4">
              Verify the vehicle registration and request details before
              approving.
            </p>
            <form className="flex flex-col gap-3" method="POST">
              <input name="requestId" type="hidden" value={id} />
              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs tracking-wider text-text-secondary uppercase">
                  Vehicle Registration Number (verify on site)
                </span>
                <input
                  required
                  className="w-full rounded-control bg-background border border-border px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary"
                  name="vehicle_registration"
                  placeholder="Enter the registration number shown on the vehicle"
                />
              </label>
              <div className="flex gap-3">
                <button
                  className="rounded-pill bg-green-500/20 text-green-600 px-6 py-2 text-sm font-medium hover:bg-green-500/30 transition-colors"
                  formAction="/api/operator/requests/approve"
                  type="submit"
                >
                  Approve
                </button>
                <button
                  className="rounded-pill bg-red-500/20 text-red-400 px-6 py-2 text-sm font-medium hover:bg-red-500/30 transition-colors"
                  formAction="/api/operator/requests/reject"
                  type="submit"
                >
                  Reject
                </button>
              </div>
            </form>
          </div>
        )}

        {request.status === "APPROVED" && (
          <div className="rounded-card bg-surface border border-border p-6">
            <h2 className="text-lg font-medium mb-4">Dispense Fuel</h2>
            <p className="text-sm text-text-secondary mb-4">
              Record the actual fuel dispensed. This will create a transaction
              and deduct inventory.
            </p>
            <DispenseForm
              pricePerLiter={Number(request.fuel_type.price_per_liter)}
              quantity={Number(request.quantity)}
              requestId={id}
            />
          </div>
        )}
      </div>
    </section>
  );
}

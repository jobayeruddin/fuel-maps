import { headers } from "next/headers";
import Link from "next/link";

import { getSessionUser } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  const request = await prisma.fuelRequest.findFirst({
    where: { request_id: parseInt(id), user_id: user.id },
    include: {
      vehicle: { select: { registration_number: true, vehicle_type: true } },
      pump: { select: { name: true, address: true } },
      fuel_type: { select: { fuel_name: true, price_per_liter: true } },
      reviewer: { select: { name: true, email: true } },
    },
  });

  if (!request) {
    return (
      <section className="py-10 px-6 max-w-4xl mx-auto text-center">
        <p className="text-text-secondary">Request not found</p>
        <Link
          className="text-primary hover:underline mt-4 inline-block"
          href="/requests"
        >
          ← Back to requests
        </Link>
      </section>
    );
  }

  const estimatedTotal =
    Number(request.fuel_type.price_per_liter) * Number(request.quantity);

  return (
    <section className="py-10 px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Requests
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Request #{request.request_id}
          </h1>
        </div>
        <Link className="text-primary hover:underline" href="/requests">
          ← Back
        </Link>
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
                ${estimatedTotal.toFixed(2)}
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
            {request.remarks && (
              <div className="md:col-span-2">
                <p className="text-xs font-mono text-text-secondary uppercase">
                  Remarks
                </p>
                <p>{request.remarks}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card bg-surface border border-border p-6">
          <h2 className="text-lg font-medium mb-4">Status Timeline</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-control bg-background border border-border">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-text-secondary">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            {request.status !== "PENDING" && (
              <div className="flex items-center gap-3 p-3 rounded-control bg-background border border-border">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    request.status === "APPROVED"
                      ? "bg-green-400"
                      : request.status === "REJECTED"
                        ? "bg-red-400"
                        : "bg-primary"
                  }`}
                />
                <div>
                  <p className="font-medium capitalize">
                    {request.status.toLowerCase()}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {request.updated_at &&
                      new Date(request.updated_at).toLocaleString()}
                    {request.reviewed_by &&
                      request.reviewer &&
                      ` by ${request.reviewer.name}`}
                  </p>
                </div>
              </div>
            )}
            {request.status === "COMPLETED" && (
              <div className="flex items-center gap-3 p-3 rounded-control bg-background border border-border">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Dispensed</p>
                  <p className="text-sm text-text-secondary">
                    Fuel dispensed and transaction recorded
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {(request.status === "PENDING" || request.status === "APPROVED") && (
          <div className="flex gap-3">
            <ConfirmForm
              action="/api/user/requests/cancel"
              className="rounded-control border border-red-500/50 text-red-400 px-6 py-2 text-sm hover:bg-red-500/10 transition-colors"
              confirmMessage="Cancel this request?"
              inputs={{ name: "requestId", value: request.request_id }}
              label="Cancel Request"
              method="POST"
            />
          </div>
        )}
      </div>
    </section>
  );
}

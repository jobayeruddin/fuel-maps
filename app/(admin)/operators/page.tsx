import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/app/components/ConfirmForm";

export default async function AdminOperatorsPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const operators = await prisma.operator.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      pump: { select: { pump_id: true, name: true } },
    },
  });

  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true, email: true },
  });

  const pumps = await prisma.oil_pumps.findMany({
    where: { status: "ACTIVE" },
    select: { pump_id: true, name: true },
  });

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Operators
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Manage Operators
          </h1>
        </div>
        <a
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          href="/operators/new"
        >
          Assign Operator
        </a>
      </div>

      {operators.length === 0 ? (
        <div className="rounded-card bg-surface border border-border p-12 text-center">
          <p className="text-text-secondary mb-4">No operators assigned yet.</p>
          <a
            className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
            href="/operators/new"
          >
            Assign First Operator
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {operators.map((op: any) => (
            <div
              key={op.operator_id}
              className="rounded-card bg-surface border border-border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg font-medium">
                    {op.user.name}
                  </p>
                  <span className="text-sm text-text-secondary">
                    {op.user.email}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${op.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-text-secondary/20 text-text-secondary"}`}
                  >
                    {op.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  Pump: {op.pump.name} • Assigned{" "}
                  {new Date(op.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="rounded-control border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                  href={`/operators/${op.operator_id}/edit`}
                >
                  Edit
                </a>
                <ConfirmForm
                  action="/api/admin/operators/delete"
                  className="rounded-control border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition-colors"
                  confirmMessage="Remove this operator assignment?"
                  inputs={{ name: "operatorId", value: op.operator_id }}
                  label="Remove"
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

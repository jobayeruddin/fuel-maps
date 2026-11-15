import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireAdminPage } from "@/lib/page-authorization";
import { prisma } from "@/lib/prisma";
import RoleSelect from "@/app/(admin)/users/RoleSelect";

export default async function AdminUsersPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireAdminPage({ user });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      operatorRecord: {
        select: { operator_id: true, pump: { select: { name: true } } },
      },
    },
  });

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Admin / Users
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight">
            Manage Users
          </h1>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Operator
              </th>
              <th className="px-6 py-3 text-left text-xs font-mono text-text-secondary uppercase">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-background/50">
                <td className="px-6 py-4">
                  <p className="font-medium">{u.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {u.email}
                </td>
                <td className="px-6 py-4">
                  <RoleSelect currentRole={u.role} userId={u.id} />
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded-full ${u.emailVerified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
                  >
                    {u.emailVerified ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {u.operatorRecord
                    ? `${u.operatorRecord.pump.name} (ID: ${u.operatorRecord.operator_id})`
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

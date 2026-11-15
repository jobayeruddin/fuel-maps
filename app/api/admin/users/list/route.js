import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET() {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

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

  return Response.json(users);
}
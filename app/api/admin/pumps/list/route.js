import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getSessionUser, requireUser } from "@/lib/authorization";

export async function GET() {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const pumps = await prisma.oil_pumps.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { pump_id: true, name: true, status: true },
  });

  return Response.json(pumps);
}
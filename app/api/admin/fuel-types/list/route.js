import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET() {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const fuelTypes = await prisma.fuel_types.findMany({
    where: { status: "ACTIVE" },
    orderBy: { fuel_name: "asc" },
    select: { fuel_type_id: true, fuel_name: true, price_per_liter: true, status: true },
  });

  return Response.json(fuelTypes);
}

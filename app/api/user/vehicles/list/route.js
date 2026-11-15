import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET() {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const vehicles = await prisma.vehicle.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: { vehicle_id: true, registration_number: true, vehicle_type: true, status: true },
  });

  return Response.json(vehicles);
}

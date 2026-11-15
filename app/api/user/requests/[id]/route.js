import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireUser({ user });
  const { id } = await params;

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
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  return Response.json(request);
}
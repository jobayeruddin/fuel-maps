import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser, verifyVehicleOwnership } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const formData = await req.formData();
  const vehicleId = parseInt(formData.get("vehicleId"));

  await verifyVehicleOwnership(user.id, vehicleId);

  await prisma.vehicle.update({
    where: { vehicle_id: vehicleId },
    data: { status: "INACTIVE" },
  });

  return Response.json({ success: true });
}
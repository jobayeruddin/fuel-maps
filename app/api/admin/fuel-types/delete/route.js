import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const formData = await req.formData();
  const fuelTypeId = parseInt(formData.get("fuelTypeId"));

  await prisma.fuel_types.update({
    where: { fuel_type_id: fuelTypeId },
    data: { status: "INACTIVE" },
  });

  return Response.json({ success: true });
}
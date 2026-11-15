import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const formData = await req.formData();
  const pumpId = parseInt(formData.get("pumpId"));

  await prisma.oil_pumps.update({
    where: { pump_id: pumpId },
    data: { status: "INACTIVE" },
  });

  return Response.json({ success: true });
}
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { pump_id, fuel_type_id } = await params;

  const inventory = await prisma.fuel_inventory.findFirst({
    where: { pump_id: parseInt(pump_id), fuel_type_id: parseInt(fuel_type_id) },
  });

  if (!inventory) {
    return Response.json({ error: "Inventory record not found" }, { status: 404 });
  }

  return Response.json(inventory);
}

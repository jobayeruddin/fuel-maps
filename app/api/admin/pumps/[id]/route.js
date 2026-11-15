import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const pump = await prisma.oil_pumps.findUnique({
    where: { pump_id: parseInt(id) },
    include: {
      operators: { include: { user: { select: { name: true, email: true } } } },
      fuel_inventory: { include: { fuel_types: true } },
    },
  });
  if (!pump) {
    return Response.json({ error: "Pump not found" }, { status: 404 });
  }
  return Response.json(pump);
}

export async function PATCH(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const body = await req.json();
  const { name, address, contact, latitude, longitude, status } = body;

  const pump = await prisma.oil_pumps.update({
    where: { pump_id: parseInt(id) },
    data: { name, address, contact: contact || null, latitude: latitude ?? null, longitude: longitude ?? null, status },
  });
  return Response.json(pump);
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  await prisma.oil_pumps.update({
    where: { pump_id: parseInt(id) },
    data: { status: "INACTIVE" },
  });
  return Response.json({ success: true });
}

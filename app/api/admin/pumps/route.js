import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const body = await req.json();
  const { name, address, contact, latitude, longitude, status } = body;

  if (!name || !address) {
    return Response.json({ error: "Pump name and address are required" }, { status: 400 });
  }

  const pump = await prisma.oil_pumps.create({
    data: {
      name,
      address,
      contact: contact || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status: status || "ACTIVE",
    },
  });

  return Response.json(pump, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const pumps = await prisma.oil_pumps.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { pump_id: true, name: true, status: true },
  });

  return Response.json(pumps);
}
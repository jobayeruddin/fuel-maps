import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const body = await req.json();
  const { registration_number, vehicle_type } = body;

  if (!registration_number || !registration_number.trim()) {
    return Response.json({ error: "Registration number is required" }, { status: 400 });
  }

  const existing = await prisma.vehicle.findUnique({
    where: { registration_number: registration_number.toUpperCase() },
  });
  if (existing) {
    return Response.json({ error: "Vehicle with this registration number already exists" }, { status: 409 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      user_id: user.id,
      registration_number: registration_number.toUpperCase(),
      vehicle_type: vehicle_type || null,
      status: "ACTIVE",
    },
  });

  return Response.json(vehicle, { status: 201 });
}
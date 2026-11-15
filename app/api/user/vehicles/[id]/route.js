import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser, verifyVehicleOwnership } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireUser({ user });
  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { vehicle_id: parseInt(id), user_id: user.id },
  });
  if (!vehicle) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 });
  }
  return Response.json(vehicle);
}

export async function PATCH(req, { params }) {
  const user = await getSessionUser(await headers());
  requireUser({ user });
  const { id } = await params;

  await verifyVehicleOwnership(user.id, parseInt(id));

  const body = await req.json();
  const { registration_number, vehicle_type, brand, model, manufacturing_year, status } = body;

  if (registration_number) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        registration_number: registration_number.toUpperCase(),
        NOT: { vehicle_id: parseInt(id) },
      },
    });
    if (existing) {
      return Response.json({ error: "Registration number already in use" }, { status: 409 });
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { vehicle_id: parseInt(id) },
    data: {
      registration_number: registration_number?.toUpperCase(),
      vehicle_type: vehicle_type || null,
      brand: brand || null,
      model: model || null,
      manufacturing_year:
        manufacturing_year === undefined || manufacturing_year === null || manufacturing_year === ""
          ? null
          : parseInt(manufacturing_year),
      status,
    },
  });
  return Response.json(vehicle);
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser(await headers());
  requireUser({ user });
  const { id } = await params;
  await verifyVehicleOwnership(user.id, parseInt(id));

  await prisma.vehicle.update({
    where: { vehicle_id: parseInt(id) },
    data: { status: "INACTIVE" },
  });
  return Response.json({ success: true });
}
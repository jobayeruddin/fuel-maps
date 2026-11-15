import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser, verifyVehicleOwnership } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const body = await req.json();
  const { vehicle_id, pump_id, fuel_type_id, quantity, remarks } = body;

  if (!vehicle_id || !pump_id || !fuel_type_id || !quantity || quantity <= 0) {
    return Response.json({ error: "Vehicle, pump, fuel type, and positive quantity are required" }, { status: 400 });
  }

  await verifyVehicleOwnership(user.id, parseInt(vehicle_id));

  const vehicle = await prisma.vehicle.findUnique({
    where: { vehicle_id: parseInt(vehicle_id) },
  });

  if (!vehicle) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 });
  }

  if (vehicle.status !== "ACTIVE") {
    return Response.json({ error: "Vehicle is not active" }, { status: 400 });
  }

  const pump = await prisma.oil_pumps.findUnique({
    where: { pump_id: parseInt(pump_id) },
  });

  if (!pump || pump.status !== "ACTIVE") {
    return Response.json({ error: "Pump not found or inactive" }, { status: 400 });
  }

  const fuelType = await prisma.fuel_types.findUnique({
    where: { fuel_type_id: parseInt(fuel_type_id) },
  });

  if (!fuelType || fuelType.status !== "ACTIVE") {
    return Response.json({ error: "Fuel type not found or inactive" }, { status: 400 });
  }

  const inventory = await prisma.fuel_inventory.findFirst({
    where: { pump_id: parseInt(pump_id), fuel_type_id: parseInt(fuel_type_id) },
  });

  if (!inventory || Number(inventory.quantity) < parseFloat(quantity)) {
    return Response.json({ error: "Insufficient stock at pump" }, { status: 400 });
  }

  const request = await prisma.fuelRequest.create({
    data: {
      user_id: user.id,
      vehicle_id: parseInt(vehicle_id),
      pump_id: parseInt(pump_id),
      fuel_type_id: parseInt(fuel_type_id),
      quantity: parseFloat(quantity),
      remarks: remarks || null,
      status: "PENDING",
    },
  });

  return Response.json(request, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const requests = await prisma.fuelRequest.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    include: {
      vehicle: { select: { registration_number: true } },
      pump: { select: { name: true } },
      fuel_type: { select: { fuel_name: true } },
    },
  });

  return Response.json(requests);
}
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const fuelType = await prisma.fuel_types.findUnique({ where: { fuel_type_id: parseInt(id) } });
  if (!fuelType) {
    return Response.json({ error: "Fuel type not found" }, { status: 404 });
  }
  return Response.json(fuelType);
}

export async function PATCH(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const body = await req.json();
  const { fuel_name, description, price_per_liter, status } = body;

  if (fuel_name) {
    const existing = await prisma.fuel_types.findFirst({
      where: { fuel_name, NOT: { fuel_type_id: parseInt(id) } },
    });
    if (existing) {
      return Response.json({ error: "Fuel type name already in use" }, { status: 409 });
    }
  }

  const fuelType = await prisma.fuel_types.update({
    where: { fuel_type_id: parseInt(id) },
    data: {
      fuel_name,
      description: description || null,
      price_per_liter: price_per_liter !== undefined ? parseFloat(price_per_liter) : undefined,
      status,
    },
  });
  return Response.json(fuelType);
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  await prisma.fuel_types.update({
    where: { fuel_type_id: parseInt(id) },
    data: { status: "INACTIVE" },
  });
  return Response.json({ success: true });
}

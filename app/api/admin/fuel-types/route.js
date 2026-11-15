import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const body = await req.json();
  const { fuel_name, description, price_per_liter, status } = body;

  if (!fuel_name || !description || price_per_liter === undefined || status === undefined) {
    return Response.json({ error: "Fuel name, description, price per liter, and status are required" }, { status: 400 });
  }

  if (price_per_liter < 0) {
    return Response.json({ error: "Price per liter must be non-negative" }, { status: 400 });
  }

  const existingFuelType = await prisma.fuel_types.findFirst({
    where: { fuel_name, NOT: { fuel_type_id: undefined } },
  });

  if (existingFuelType) {
    return Response.json({ error: "Fuel type already exists" }, { status: 409 });
  }

  const fuelType = await prisma.fuel_types.create({
    data: {
      fuel_name,
      description: description || null,
      price_per_liter: parseFloat(price_per_liter),
      status,
    },
  });

  return Response.json(fuelType, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const fuelTypes = await prisma.fuel_types.findMany({
    orderBy: { fuel_name: "asc" },
    include: { fuel_inventory: true },
  });

  return Response.json(fuelTypes);
}

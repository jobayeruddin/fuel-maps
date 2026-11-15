import { prisma } from "@/lib/prisma";
import { getSessionUser, requireOperator, getOperatorPumpId } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireOperator({ user });
  const pumpId = await getOperatorPumpId({ user });

  const body = await req.json();
  const { fuel_type_id, quantity, remarks } = body;

  if (!fuel_type_id || !quantity || parseFloat(quantity) <= 0) {
    return Response.json(
      { error: "Fuel type and a positive quantity are required" },
      { status: 400 },
    );
  }

  const fuelType = await prisma.fuel_types.findUnique({
    where: { fuel_type_id: parseInt(fuel_type_id) },
  });

  if (!fuelType) {
    return Response.json({ error: "Fuel type not found" }, { status: 404 });
  }

  if (fuelType.status !== "ACTIVE") {
    return Response.json({ error: "Fuel type is not active" }, { status: 400 });
  }

  const qty = parseFloat(quantity);

  const result = await prisma.$transaction(async (tx) => {
    const inventory = await tx.fuel_inventory.findFirst({
      where: { pump_id: pumpId, fuel_type_id: parseInt(fuel_type_id) },
    });

    let newBalance;
    if (!inventory) {
      const created = await tx.fuel_inventory.create({
        data: {
          pump_id: pumpId,
          fuel_type_id: parseInt(fuel_type_id),
          quantity: qty,
        },
      });
      newBalance = created.quantity;
    } else {
      const updated = await tx.fuel_inventory.update({
        where: {
          pump_id_fuel_type_id: {
            pump_id: pumpId,
            fuel_type_id: parseInt(fuel_type_id),
          },
        },
        data: { quantity: { increment: qty } },
      });
      newBalance = updated.quantity;
    }

    const movement = await tx.inventoryTransaction.create({
      data: {
        pump_id: pumpId,
        fuel_type_id: parseInt(fuel_type_id),
        movement_type: "STOCK_IN",
        quantity_change: qty,
        resulting_balance: newBalance,
        transaction_id: null,
        actor_id: user.id,
        remarks: remarks || null,
      },
    });

    return { inventory_balance: newBalance, movement_id: movement.movement_id };
  });

  return Response.json({ success: true, ...result });
}
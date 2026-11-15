import { prisma } from "@/lib/prisma";
import { getSessionUser, requireOperator, getOperatorPumpId } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireOperator({ user });
  const pumpId = await getOperatorPumpId({ user });

  const body = await req.json();
  const { fuel_type_id, adjustment_type, quantity, remarks } = body;

  if (
    !fuel_type_id ||
    !adjustment_type ||
    quantity === undefined ||
    remarks === undefined ||
    String(remarks).trim() === ""
  ) {
    return Response.json(
      { error: "Fuel type, adjustment type, quantity, and remarks are required" },
      { status: 400 },
    );
  }

  const type = String(adjustment_type).toUpperCase();
  if (type !== "ABSOLUTE" && type !== "RELATIVE") {
    return Response.json(
      { error: "Invalid adjustment type. Must be ABSOLUTE or RELATIVE" },
      { status: 400 },
    );
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty)) {
    return Response.json({ error: "Quantity must be a number" }, { status: 400 });
  }

  if (type === "ABSOLUTE" && qty < 0) {
    return Response.json(
      { error: "Quantity must be non-negative for absolute adjustment" },
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`SELECT quantity FROM fuel_inventory WHERE pump_id = ${pumpId} AND fuel_type_id = ${parseInt(fuel_type_id)} FOR UPDATE`;

      if (!locked || locked.length === 0) {
        throw Object.assign(new Error("Inventory record not found"), { status: 404 });
      }

      const currentQuantity = Number(locked[0].quantity);
      let newBalance;
      let quantityChange;

      if (type === "ABSOLUTE") {
        quantityChange = qty - currentQuantity;
        newBalance = qty;
      } else {
        quantityChange = qty;
        newBalance = currentQuantity + qty;
        if (newBalance < 0) {
          throw Object.assign(
            new Error("Adjustment would make stock negative"),
            { status: 400 },
          );
        }
      }

      const updated = await tx.fuel_inventory.update({
        where: {
          pump_id_fuel_type_id: {
            pump_id: pumpId,
            fuel_type_id: parseInt(fuel_type_id),
          },
        },
        data: { quantity: newBalance },
      });

      const movement = await tx.inventoryTransaction.create({
        data: {
          pump_id: pumpId,
          fuel_type_id: parseInt(fuel_type_id),
          movement_type: "ADJUSTMENT",
          quantity_change: quantityChange,
          resulting_balance: updated.quantity,
          transaction_id: null,
          actor_id: user.id,
          remarks: String(remarks).trim(),
        },
      });

      return { inventory_balance: updated.quantity, movement_id: movement.movement_id };
    });

    return Response.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
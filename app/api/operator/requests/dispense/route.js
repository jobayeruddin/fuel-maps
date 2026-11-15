import { prisma } from "@/lib/prisma";
import { getSessionUser, requireOperator, getOperatorPumpId } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireOperator({ user });
  const pumpId = await getOperatorPumpId({ user });

  const body = await req.json();
  const requestId = parseInt(body.requestId);
  const actualQuantity = parseFloat(body.actual_quantity);
  const remarks = body.remarks || null;

  if (!actualQuantity || actualQuantity <= 0) {
    return Response.json({ error: "Valid quantity is required" }, { status: 400 });
  }

  const request = await prisma.fuelRequest.findUnique({
    where: { request_id: requestId },
    include: { fuel_type: true },
  });

  if (!request) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.pump_id !== pumpId) {
    return Response.json({ error: "Unauthorized - request not for your pump" }, { status: 403 });
  }

  if (request.status !== "APPROVED") {
    return Response.json({ error: "Request must be approved before dispensing" }, { status: 400 });
  }

  if (actualQuantity > Number(request.quantity)) {
    return Response.json({ error: "Dispensed quantity cannot exceed requested quantity" }, { status: 400 });
  }

  const operator = await prisma.operator.findUnique({
    where: { user_id: user.id },
  });

  if (!operator || operator.pump_id !== pumpId) {
    return Response.json({ error: "Operator not assigned to this pump" }, { status: 403 });
  }

  const unitPrice = Number(request.fuel_type.price_per_liter);

  const result = await prisma.$transaction(async (tx) => {
    // Lock the inventory row and check stock within transaction
    const locked = await tx.$queryRaw`SELECT quantity FROM fuel_inventory WHERE pump_id = ${pumpId} AND fuel_type_id = ${request.fuel_type_id} FOR UPDATE`;
    const lockedQuantity = Number(locked[0]?.quantity ?? 0);

    if (lockedQuantity < actualQuantity) {
      throw new Error("Insufficient stock");
    }

    // Double-check request status hasn't changed
    const currentRequest = await tx.fuelRequest.findUnique({
      where: { request_id: requestId },
    });

    if (!currentRequest || currentRequest.status !== "APPROVED") {
      throw new Error("Request is no longer approved for dispensing");
    }

    if (actualQuantity > Number(currentRequest.quantity)) {
      throw new Error("Dispensed quantity cannot exceed requested quantity");
    }

    // Update request status to COMPLETED
    const updatedRequest = await tx.fuelRequest.update({
      where: { request_id: requestId },
      data: { status: "COMPLETED", updated_at: new Date() },
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        request_id: requestId,
        user_id: request.user_id,
        vehicle_id: request.vehicle_id,
        pump_id: pumpId,
        fuel_type_id: request.fuel_type_id,
        operator_id: operator.operator_id,
        quantity: actualQuantity,
        unit_price: unitPrice,
        total_amount: actualQuantity * unitPrice,
        dispensed_at: new Date(),
      },
    });

    // Deduct inventory
    await tx.fuel_inventory.update({
      where: { pump_id_fuel_type_id: { pump_id: pumpId, fuel_type_id: request.fuel_type_id } },
      data: { quantity: { decrement: actualQuantity }, last_updated: new Date() },
    });

    // Create inventory movement record
    await tx.inventoryTransaction.create({
      data: {
        pump_id: pumpId,
        fuel_type_id: request.fuel_type_id,
        movement_type: "DISPENSE",
        quantity_change: -actualQuantity,
        resulting_balance: lockedQuantity - actualQuantity,
        transaction_id: transaction.transaction_id,
        actor_id: user.id,
        remarks: remarks || `Dispensed for request #${requestId}`,
      },
    });

    return { request: updatedRequest, transaction };
  }, {
    isolationLevel: "Serializable",
    maxWait: 5000,
    timeout: 10000,
  });

  return Response.json(result, { status: 201 });
}
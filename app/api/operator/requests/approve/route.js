import { prisma } from "@/lib/prisma";
import { getSessionUser, requireOperator, getOperatorPumpId } from "@/lib/authorization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireOperator({ user });
  const pumpId = await getOperatorPumpId({ user });

  const formData = await req.formData();
  const requestId = parseInt(formData.get("requestId"));
  const enteredReg = String(formData.get("vehicle_registration") || "").trim().toUpperCase();

  const request = await prisma.fuelRequest.findUnique({
    where: { request_id: requestId },
    include: { vehicle: { select: { registration_number: true } } },
  });

  if (!request) {
    redirect("/operator?error=request_not_found");
  }

  if (request.pump_id !== pumpId) {
    redirect("/operator?error=unauthorized");
  }

  if (request.status !== "PENDING") {
    redirect("/operator?error=invalid_status");
  }

  if (!enteredReg || enteredReg !== request.vehicle.registration_number.toUpperCase()) {
    redirect(`/operator/requests/${requestId}?error=vehicle_mismatch`);
  }

  const result = await prisma.fuelRequest.updateMany({
    where: {
      request_id: requestId,
      pump_id: pumpId,
      status: "PENDING",
    },
    data: {
      status: "APPROVED",
      reviewed_by: user.id,
      updated_at: new Date(),
    },
  });

  if (result.count === 0) {
    redirect("/operator?error=invalid_status");
  }

  redirect(`/operator/requests/${requestId}`);
}
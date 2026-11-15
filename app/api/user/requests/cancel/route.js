import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const formData = await req.formData();
  const requestId = parseInt(formData.get("requestId"));

  if (!requestId) {
    return Response.json({ error: "Request ID is required" }, { status: 400 });
  }

  // Atomic cancel: only succeeds for PENDING/APPROVED requests owned by this user.
  const result = await prisma.fuelRequest.updateMany({
    where: {
      request_id: requestId,
      user_id: user.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    data: { status: "CANCELLED", updated_at: new Date() },
  });

  if (result.count === 0) {
    return Response.json({ error: "Request not found or cannot be cancelled" }, { status: 400 });
  }

  return Response.json({ success: true });
}
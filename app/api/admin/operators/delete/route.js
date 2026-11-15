import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const formData = await req.formData();
  const operatorId = parseInt(formData.get("operatorId"));

  const operator = await prisma.operator.findUnique({
    where: { operator_id: operatorId },
    include: { user: true },
  });

  if (!operator) {
    return Response.json({ error: "Operator not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.operator.update({
      where: { operator_id: operatorId },
      data: { status: "INACTIVE" },
    });

    await tx.user.update({
      where: { id: operator.user_id },
      data: { role: "USER" },
    });
  });

  return Response.json({ success: true });
}
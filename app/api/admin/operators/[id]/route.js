import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const operator = await prisma.operator.findUnique({
    where: { operator_id: parseInt(id) },
    include: { user: true, pump: true },
  });
  if (!operator) {
    return Response.json({ error: "Operator not found" }, { status: 404 });
  }
  return Response.json(operator);
}

export async function PATCH(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const body = await req.json();
  const { pump_id, status } = body;

  const operator = await prisma.operator.update({
    where: { operator_id: parseInt(id) },
    data: {
      pump_id: pump_id ? parseInt(pump_id) : undefined,
      status,
    },
    include: { user: true, pump: true },
  });

  return Response.json(operator);
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  const operator = await prisma.operator.findUnique({
    where: { operator_id: parseInt(id) },
    include: { user: true },
  });

  if (!operator) {
    return Response.json({ error: "Operator not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.operator.update({
      where: { operator_id: parseInt(id) },
      data: { status: "INACTIVE" },
    });

    await tx.user.update({
      where: { id: operator.user_id },
      data: { role: "USER" },
    });
  });

  return Response.json({ success: true });
}
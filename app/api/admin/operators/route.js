import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function POST(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const body = await req.json();
  const { user_id, pump_id, status } = body;

  if (!user_id || !pump_id) {
    return Response.json({ error: "User and pump are required" }, { status: 400 });
  }

  const existing = await prisma.operator.findUnique({ where: { user_id } });
  if (existing) {
    return Response.json({ error: "This user is already assigned as an operator" }, { status: 409 });
  }

  const existingUser = await prisma.user.findUnique({ where: { id: user_id } });
  if (!existingUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  if (existingUser.role !== "USER") {
    return Response.json({ error: "User already has a role other than USER" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const operator = await tx.operator.create({
      data: { user_id, pump_id: parseInt(pump_id), status: status || "ACTIVE" },
      include: { user: true, pump: true },
    });

    await tx.user.update({
      where: { id: user_id },
      data: { role: "OPERATOR" },
    });

    return operator;
  });

  return Response.json(result, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const operators = await prisma.operator.findMany({
    orderBy: { created_at: "desc" },
    include: { user: { select: { id: true, name: true, email: true } }, pump: { select: { pump_id: true, name: true } } },
  });

  return Response.json(operators);
}
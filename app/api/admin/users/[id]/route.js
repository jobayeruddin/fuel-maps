import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function PATCH(req, { params }) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });
  const { id } = await params;

  if (user.id === id) {
    return Response.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const body = await req.json();
  const { role } = body;

  if (!["USER", "OPERATOR", "ADMIN"].includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (role === "OPERATOR") {
    const existingOperator = await prisma.operator.findUnique({ where: { user_id: id } });
    if (!existingOperator) {
      return Response.json({ error: "User must be assigned as an operator first" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return Response.json(updated);
}
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  const q = (url.searchParams.get("q") || "").trim();
  const pumpId = url.searchParams.get("pump_id");
  const fuelTypeId = url.searchParams.get("fuel_type_id");
  const operatorId = url.searchParams.get("operator_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where = {};
  if (pumpId) where.pump_id = parseInt(pumpId);
  if (fuelTypeId) where.fuel_type_id = parseInt(fuelTypeId);
  if (operatorId) where.operator_id = parseInt(operatorId);
  if (from || to) {
    where.dispensed_at = {};
    if (from) where.dispensed_at.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.dispensed_at.lte = end;
    }
  }
  if (q) {
    where.user = { name: { contains: q } };
  }

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dispensed_at: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { registration_number: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
        operator: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return Response.json({
    rows: rows.map((t) => ({
      transaction_id: t.transaction_id,
      request_id: t.request_id,
      user: t.user.name,
      email: t.user.email,
      vehicle: t.vehicle.registration_number,
      pump: t.pump.name,
      fuel_type: t.fuel_type.fuel_name,
      operator: t.operator.user.name,
      quantity: Number(t.quantity),
      unit_price: Number(t.unit_price),
      total_amount: Number(t.total_amount),
      dispensed_at: t.dispensed_at,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
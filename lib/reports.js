import { prisma } from "./prisma";
import { LOW_STOCK_THRESHOLD } from "./constants";

export async function getAdminReportData(filters = {}) {
  const {
    from,
    to,
    pump_id,
    fuel_type_id,
    operator_id,
  } = filters;

  const dateFilter = {};
  if (from || to) {
    dateFilter.dispensed_at = {};
    if (from) dateFilter.dispensed_at.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.dispensed_at.lte = end;
    }
  }

  const transactionWhere = { ...dateFilter };
  if (pump_id) transactionWhere.pump_id = parseInt(pump_id);
  if (fuel_type_id) transactionWhere.fuel_type_id = parseInt(fuel_type_id);
  if (operator_id) transactionWhere.operator_id = parseInt(operator_id);

  const [totalByType, totalByPump, totalTransactions, totalVolume, totalRevenue, lowStock, inventory] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["fuel_type_id"],
        where: transactionWhere,
        _sum: { quantity: true, total_amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["pump_id"],
        where: transactionWhere,
        _sum: { quantity: true, total_amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.count({ where: transactionWhere }),
      prisma.transaction.aggregate({ where: transactionWhere, _sum: { quantity: true, total_amount: true } }),
      prisma.transaction.aggregate({ where: transactionWhere, _sum: { total_amount: true } }),
      prisma.fuel_inventory.findMany({
        where: { quantity: { lt: LOW_STOCK_THRESHOLD } },
        include: {
          oil_pumps: { select: { name: true } },
          fuel_types: { select: { fuel_name: true } },
        },
      }),
      prisma.fuel_inventory.findMany({
        include: {
          oil_pumps: { select: { name: true } },
          fuel_types: { select: { fuel_name: true } },
        },
      }),
    ]);

  const fuelTypeIds = totalByType.map((t) => t.fuel_type_id);
  const fuelTypes = await prisma.fuel_types.findMany({
    where: { fuel_type_id: { in: fuelTypeIds } },
    select: { fuel_type_id: true, fuel_name: true },
  });
  const fuelTypeMap = Object.fromEntries(fuelTypes.map((f) => [f.fuel_type_id, f.fuel_name]));

  const pumpIds = totalByPump.map((t) => t.pump_id);
  const pumps = await prisma.oil_pumps.findMany({
    where: { pump_id: { in: pumpIds } },
    select: { pump_id: true, name: true },
  });
  const pumpMap = Object.fromEntries(pumps.map((p) => [p.pump_id, p.name]));

  return {
    totalByType: totalByType.map((t) => ({
      fuel_type_id: t.fuel_type_id,
      fuel_name: fuelTypeMap[t.fuel_type_id] || "Unknown",
      quantity: Number(t._sum.quantity || 0),
      revenue: Number(t._sum.total_amount || 0),
      transactions: t._count._all,
    })),
    totalByPump: totalByPump.map((t) => ({
      pump_id: t.pump_id,
      pump_name: pumpMap[t.pump_id] || `Pump #${t.pump_id}`,
      quantity: Number(t._sum.quantity || 0),
      revenue: Number(t._sum.total_amount || 0),
      transactions: t._count._all,
    })),
    totalTransactions,
    totalVolume: Number(totalVolume._sum.quantity || 0),
    totalRevenue: Number(totalRevenue._sum.total_amount || 0),
    lowStock,
    inventory,
  };
}
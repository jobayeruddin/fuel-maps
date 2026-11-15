import { prisma } from "./prisma";
import { auth } from "./auth";
import { LOW_STOCK_THRESHOLD } from "./constants";

export const ROLES = {
  USER: "USER",
  OPERATOR: "OPERATOR",
  ADMIN: "ADMIN",
};

export async function getSessionUser(headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  return user;
}

export function requireAuth(session) {
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}

export function requireRole(session, ...allowedRoles) {
  const user = requireAuth(session);
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function requireUser(session) {
  return requireRole(session, ROLES.USER, ROLES.OPERATOR, ROLES.ADMIN);
}

export function requireOperator(session) {
  return requireRole(session, ROLES.OPERATOR, ROLES.ADMIN);
}

export function requireAdmin(session) {
  return requireRole(session, ROLES.ADMIN);
}

export async function getOperatorPumpId(session) {
  const user = requireOperator(session);
  const operator = await prisma.operator.findUnique({
    where: { user_id: user.id },
    select: { pump_id: true, status: true },
  });
  if (!operator || operator.status !== "ACTIVE") {
    throw new Error("OPERATOR_NOT_ASSIGNED");
  }
  return operator.pump_id;
}

export async function verifyVehicleOwnership(userId, vehicleId) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { vehicle_id: vehicleId, user_id: userId },
    select: { vehicle_id: true },
  });
  if (!vehicle) {
    throw new Error("VEHICLE_NOT_FOUND");
  }
  return vehicle;
}

export async function verifyPumpAccess(userId, pumpId) {
  const operator = await prisma.operator.findFirst({
    where: { user_id: userId, pump_id: pumpId, status: "ACTIVE" },
    select: { operator_id: true },
  });
  if (!operator) {
    throw new Error("PUMP_ACCESS_DENIED");
  }
  return operator;
}

export async function getAdminDashboardData() {
  const [
    totalUsers,
    totalOperators,
    totalPumps,
    pendingRequests,
    lowStockItems,
    recentRequests,
    recentTransactions,
    totalVolumeDispensed,
    totalRevenue,
    requestsByStatus,
    topPumpsByVolume,
    dailyVolumeLast7Days,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.operator.count({ where: { status: "ACTIVE" } }),
    prisma.oil_pumps.count({ where: { status: "ACTIVE" } }),
    prisma.fuelRequest.count({ where: { status: "PENDING" } }),
    prisma.fuel_inventory.findMany({
      where: { quantity: { lt: LOW_STOCK_THRESHOLD } },
      include: {
        oil_pumps: { select: { name: true } },
        fuel_types: { select: { fuel_name: true } },
      },
      take: 10,
    }),
    prisma.fuelRequest.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.transaction.findMany({
      orderBy: { dispensed_at: "desc" },
      take: 10,
      include: {
        user: { select: { name: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { quantity: true, total_amount: true },
    }),
    prisma.transaction.aggregate({
      _sum: { total_amount: true },
    }),
    prisma.fuelRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.transaction.groupBy({
      by: ["pump_id"],
      _sum: { quantity: true, total_amount: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    getDailyVolumeLast7Days(),
  ]);

  const pumpNames = await prisma.oil_pumps.findMany({
    where: { pump_id: { in: topPumpsByVolume.map((p) => p.pump_id) } },
    select: { pump_id: true, name: true },
  });
  const pumpNameMap = Object.fromEntries(pumpNames.map((p) => [p.pump_id, p.name]));

  return {
    stats: {
      totalUsers,
      totalOperators,
      totalPumps,
      pendingRequests,
      totalVolumeDispensed: totalVolumeDispensed._sum.quantity || 0,
      totalRevenue: totalRevenue._sum.total_amount || 0,
    },
    lowStockItems,
    recentRequests,
    recentTransactions,
    requestsByStatus,
    topPumpsByVolume: topPumpsByVolume.map((p) => ({
      ...p,
      pump_name: pumpNameMap[p.pump_id] || `Pump #${p.pump_id}`,
    })),
    dailyVolumeLast7Days,
  };
}

async function getDailyVolumeLast7Days() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const transactions = await prisma.transaction.findMany({
    where: { dispensed_at: { gte: sevenDaysAgo } },
    select: { dispensed_at: true, quantity: true, total_amount: true },
  });

  const dailyData = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().split("T")[0];
    dailyData[key] = { volume: 0, revenue: 0, date: key };
  }

  for (const t of transactions) {
    const key = t.dispensed_at.toISOString().split("T")[0];
    if (dailyData[key]) {
      dailyData[key].volume += Number(t.quantity);
      dailyData[key].revenue += Number(t.total_amount);
    }
  }

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserDashboardData(userId) {
  const [vehicles, requests, transactions, stats] = await Promise.all([
    prisma.vehicle.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        vehicle_id: true,
        registration_number: true,
        vehicle_type: true,
        status: true,
        created_at: true,
      },
    }),
    prisma.fuelRequest.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        vehicle: { select: { registration_number: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { dispensed_at: "desc" },
      take: 10,
      include: {
        vehicle: { select: { registration_number: true } },
        pump: { select: { name: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.fuelRequest.groupBy({
      by: ["status"],
      where: { user_id: userId },
      _count: { status: true },
    }),
  ]);
  return { vehicles, requests, transactions, requestsByStatus: stats };
}

export async function getOperatorDashboardData(pumpId, operatorId) {
  const operator = await prisma.operator.findUnique({
    where: { operator_id: operatorId },
    include: { pump: true },
  });
  if (!operator) return null;

  const [pendingRequests, approvedRequests, inventory, recentDispensing, pumpStats] = await Promise.all([
    prisma.fuelRequest.findMany({
      where: { pump_id: pumpId, status: "PENDING" },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { registration_number: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.fuelRequest.findMany({
      where: { pump_id: pumpId, status: "APPROVED" },
      orderBy: { created_at: "asc" },
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { registration_number: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.fuel_inventory.findMany({
      where: { pump_id: pumpId },
      include: { fuel_types: { select: { fuel_name: true, price_per_liter: true } } },
    }),
    prisma.transaction.findMany({
      where: { pump_id: pumpId, operator_id: operatorId },
      orderBy: { dispensed_at: "desc" },
      take: 20,
      include: {
        user: { select: { name: true } },
        vehicle: { select: { registration_number: true } },
        fuel_type: { select: { fuel_name: true } },
      },
    }),
    prisma.transaction.aggregate({
      where: { pump_id: pumpId, operator_id: operatorId },
      _sum: { quantity: true, total_amount: true },
    }),
  ]);
  return { operator, pendingRequests, approvedRequests, inventory, recentDispensing, pumpStats };
}
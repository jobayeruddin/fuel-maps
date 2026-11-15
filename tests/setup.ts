import { beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = new URL(process.env.DATABASE_URL || "mysql://localhost:3306/test");

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });

// Only touch the database when explicitly opt-in, so the documented
// placeholder tests run green without a reachable MySQL instance.
const RUN_DB_TESTS = process.env.RUN_DB_TESTS === "1";

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;
  await prisma.$connect();
});

afterAll(async () => {
  if (!RUN_DB_TESTS) return;
  await prisma.$disconnect();
});

const CLEANUP_TABLES = [
  "inventory_transactions",
  "transactions",
  "fuel_requests",
  "vehicles",
  "operators",
  "fuel_inventory",
  "oil_pumps",
  "fuel_types",
  "user",
];

export const testUtils = {
  async cleanup() {
    // MySQL has no TRUNCATE ... CASCADE; toggle FK checks per statement.
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of CLEANUP_TABLES) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
      }
    } finally {
      await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  },
  
  async createTestUser(role: "USER" | "OPERATOR" | "ADMIN" = "USER") {
    const { randomUUID } = await import("crypto");
    return prisma.user.create({
      data: {
        id: randomUUID(),
        email: `test-${role.toLowerCase()}-${Date.now()}@test.opms`,
        name: `Test ${role}`,
        // Note: Better Auth stores password in Account table, not User table
        emailVerified: true,
        role,
      },
    });
  },
  
  async createTestPump() {
    return prisma.oil_pumps.create({
      data: {
        name: `Test Pump ${Date.now()}`,
        address: "Test Address",
        status: "ACTIVE",
        latitude: 23.8103,
        longitude: 90.4125,
      },
    });
  },
  
  async createTestFuelType() {
    return prisma.fuel_types.create({
      data: {
        fuel_name: `Fuel ${Date.now()}`,
        price_per_liter: 85.00,
        status: "ACTIVE",
      },
    });
  },
  
  async createTestVehicle(userId: string) {
    return prisma.vehicle.create({
      data: {
        user_id: userId,
        registration_number: `TEST-${Date.now()}`,
        vehicle_type: "Sedan",
        status: "ACTIVE",
      },
    });
  },
  
  async createTestRequest(userId: string, vehicleId: number, pumpId: number, fuelTypeId: number) {
    return prisma.fuelRequest.create({
      data: {
        user_id: userId,
        vehicle_id: vehicleId,
        pump_id: pumpId,
        fuel_type_id: fuelTypeId,
        quantity: 50,
        status: "PENDING",
      },
    });
  },
};
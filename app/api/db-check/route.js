import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.fuel_types.findMany({
      take: 1,
      select: {
        fuel_type_id: true,
        fuel_name: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Prisma connected to MySQL successfully",
    });
  } catch (error) {
    console.error("Database check failed:", error);

    return NextResponse.json(
      { success: false, message: "Database connection failed" },
      { status: 500 },
    );
  }
}
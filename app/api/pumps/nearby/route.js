import { prisma } from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/authorization";
import { headers } from "next/headers";

const EARTH_RADIUS_KM = 6371;

function haversine(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export async function GET(req) {
  const user = await getSessionUser(await headers());
  requireUser({ user });

  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") || "");
  const lng = parseFloat(url.searchParams.get("lng") || "");
  const rawRadius = parseFloat(url.searchParams.get("radius") || "10");

  if (
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return Response.json(
      { error: "Valid lat (-90..90) and lng (-180..180) query parameters are required" },
      { status: 400 },
    );
  }

  const radius = isNaN(rawRadius) ? 10 : Math.min(100, Math.max(0.1, rawRadius));

  const pumps = await prisma.oil_pumps.findMany({
    where: {
      status: "ACTIVE",
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      fuel_inventory: {
        where: {
          fuel_types: { status: "ACTIVE" },
          quantity: { gt: 0 },
        },
        include: {
          fuel_types: {
            select: {
              fuel_type_id: true,
              fuel_name: true,
              price_per_liter: true,
            },
          },
        },
      },
    },
  });

  const nearby = pumps
    .map((pump) => {
      const pumpLat = Number(pump.latitude);
      const pumpLng = Number(pump.longitude);
      const distance = haversine(lat, lng, pumpLat, pumpLng);

      if (distance > radius) return null;

      return {
        pump_id: pump.pump_id,
        name: pump.name,
        address: pump.address,
        contact: pump.contact,
        latitude: pumpLat,
        longitude: pumpLng,
        distance_km: Number(distance.toFixed(2)),
        fuel: pump.fuel_inventory.map((inv) => ({
          fuel_type_id: inv.fuel_types.fuel_type_id,
          fuel_name: inv.fuel_types.fuel_name,
          price_per_liter: Number(inv.fuel_types.price_per_liter),
          quantity: Number(inv.quantity),
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_km - b.distance_km);

  return Response.json({ pumps: nearby, user_lat: lat, user_lng: lng, radius });
}
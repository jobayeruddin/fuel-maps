import { getAdminReportData } from "@/lib/reports";
import { getSessionUser, requireAdmin } from "@/lib/authorization";
import { headers } from "next/headers";

export async function GET(req) {
  const user = await getSessionUser(await headers());
  requireAdmin({ user });

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const pump_id = url.searchParams.get("pump_id") || undefined;
  const fuel_type_id = url.searchParams.get("fuel_type_id") || undefined;
  const operator_id = url.searchParams.get("operator_id") || undefined;

  const data = await getAdminReportData({ from, to, pump_id, fuel_type_id, operator_id });
  return Response.json(data);
}
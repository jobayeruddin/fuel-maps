import { headers } from "next/headers";

import NearbyClient from "./NearbyClient";

import { getSessionUser } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";

export default async function NearbyPage() {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  return <NearbyClient />;
}

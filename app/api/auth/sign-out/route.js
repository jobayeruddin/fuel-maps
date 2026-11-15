import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (session) await auth.api.signOut({ headers: h });
  redirect("/login");
}

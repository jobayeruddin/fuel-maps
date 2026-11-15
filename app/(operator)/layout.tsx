import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireOperatorPage } from "@/lib/page-authorization";
import { OperatorSidebar } from "@/components/OperatorSidebar";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireOperatorPage({ user });

  return (
    <div className="flex min-h-screen bg-background">
      <OperatorSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

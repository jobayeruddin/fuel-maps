import { headers } from "next/headers";

import { getSessionUser } from "@/lib/authorization";
import { requireUserPage } from "@/lib/page-authorization";
import { UserSidebar } from "@/components/UserSidebar";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const user = await getSessionUser(headersList);

  requireUserPage({ user });

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

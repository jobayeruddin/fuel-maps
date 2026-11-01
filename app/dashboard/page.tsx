"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  React.useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm text-text-secondary">Loading...</p>
      </section>
    );
  }

  const name = session.user?.name || "Alex";

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-20 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
        Dashboard
      </p>
      <h1 className="text-4xl font-medium tracking-tight">Hello, {name}</h1>
      <p className="max-w-md text-sm text-text-secondary">
        You are signed in. Sign out anytime from the button below.
      </p>
      <button
        onClick={() => authClient.signOut()}
        className="rounded-pill border border-border px-6 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        Logout
      </button>
    </section>
  );
}
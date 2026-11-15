"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export const Navbar = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = session?.user;
  const role = (user as any)?.role;

  const roleHome =
    role === "ADMIN"
      ? "/admin"
      : role === "OPERATOR"
        ? "/operator"
        : "/dashboard";

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { label: "Home", href: "/" },
    role
      ? {
          label:
            role === "ADMIN"
              ? "Admin"
              : role === "OPERATOR"
                ? "Operator"
                : "Dashboard",
          href: roleHome,
        }
      : { label: "Login", href: "/login" },
    user ? { label: "Nearby", href: "/nearby" } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        <Link className="flex items-center gap-1" href={role ? roleHome : "/"}>
          <Logo />
          <p className="font-bold text-inherit">{siteConfig.name}</p>
        </Link>

        <ul className="hidden lg:flex gap-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                className="text-foreground hover:text-accent transition-colors"
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeSwitch />
          {isPending ? (
            <span className="hidden sm:inline text-sm text-text-secondary">
              …
            </span>
          ) : user ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-text-secondary">{user.name}</span>
              <button
                className="rounded-pill border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                type="button"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              className="hidden sm:inline-flex rounded-pill bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
              href="/login"
            >
              Sign in
            </Link>
          )}
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className="p-2 sm:hidden"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="border-t border-separator sm:hidden">
          <ul className="flex flex-col gap-2 px-4 pb-4">
            {navItems.map((item) => (
              <li key={item.label + item.href}>
                <Link
                  className={clsx(
                    "block py-2 text-lg no-underline",
                    item.label === "Logout" ? "text-danger" : "text-foreground",
                  )}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {user ? (
              <li>
                <button
                  className="block py-2 text-lg text-danger"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut();
                  }}
                >
                  Sign out
                </button>
              </li>
            ) : (
              <li>
                <Link
                  className="block py-2 text-lg text-foreground"
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

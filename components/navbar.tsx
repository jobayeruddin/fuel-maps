"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        <Link className="flex items-center gap-1" href="/">
          <Logo />
          <p className="font-bold text-inherit">{siteConfig.name}</p>
        </Link>

        <ul className="hidden lg:flex gap-4">
          {siteConfig.navItems.map((item) => (
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
          <div className="hidden sm:flex">
            <Link
              className="rounded-pill bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
              href="/login"
            >
              Sign in
            </Link>
          </div>
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
            className="p-2 sm:hidden"
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
            {siteConfig.navMenuItems.map((item) => (
              <li key={item.label}>
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
          </ul>
        </div>
      )}
    </nav>
  );
};

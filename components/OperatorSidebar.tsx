"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { label: "Dashboard", href: "/operator" },
  { label: "Inventory", href: "/inventory-page" },
];

export function OperatorSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Toggle sidebar"
        className="lg:hidden fixed top-16 left-4 rounded-pill bg-primary p-2 text-black hover:opacity-90 transition-opacity"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileOpen ? (
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

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transition-transform duration-300 ease-in-out flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Operator
          </p>
          <button
            className="lg:hidden p-1"
            onClick={() => setIsMobileOpen(false)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/operator" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-text-secondary hover:bg-background hover:text-text-primary",
                )}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-secondary text-center">
            BD Fuel Maps
          </p>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-background lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

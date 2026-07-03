"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/github", label: "GitHub Pulse" },
  { href: "/crypto", label: "Crypto Pulse" },
  { href: "/weather", label: "Weather Pulse" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap gap-2 border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            className={
              isActive
                ? "rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100"
                : "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
            }
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

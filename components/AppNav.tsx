"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview", tone: "cyan" },
  { href: "/github", label: "GitHub Pulse", tone: "emerald" },
  { href: "/crypto", label: "Crypto Pulse", tone: "amber" },
  { href: "/weather", label: "Weather Pulse", tone: "sky" },
] as const;

const activeToneClasses = {
  amber:
    "border-amber-300/40 bg-amber-300/10 text-amber-100",
  cyan: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  emerald:
    "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  sky: "border-sky-300/40 bg-sky-300/10 text-sky-100",
};

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
                ? `rounded-lg border px-3 py-2 text-sm font-semibold ${activeToneClasses[item.tone]}`
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

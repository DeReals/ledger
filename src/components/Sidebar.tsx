"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/accounts", label: "Accounts", icon: "▤" },
  { href: "/transactions", label: "Transactions", icon: "⇄" },
  { href: "/budgets", label: "Budgets", icon: "◑" },
  { href: "/categories", label: "Categories", icon: "☰" },
  { href: "/reports", label: "Reports", icon: "▦" },
  { href: "/recurring", label: "Recurring", icon: "↻" },
  { href: "/goals", label: "Goals", icon: "★" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:gap-1 md:overflow-visible md:p-4">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-orange-600 text-white"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            }`}
          >
            <span aria-hidden className="text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

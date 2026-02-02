"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MapPin, Search, Activity, Tag, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPrintQueueCount } from "@/lib/print-queue";

const navItems = [
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/search", label: "Search", icon: Search },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/print-queue", label: "Print", icon: Printer },
];

export function MainNav() {
  const pathname = usePathname();
  const [printQueueCount, setPrintQueueCount] = useState(0);

  useEffect(() => {
    // Initial count
    setPrintQueueCount(getPrintQueueCount());

    // Listen for changes
    const handleChange = () => setPrintQueueCount(getPrintQueueCount());
    window.addEventListener("print-queue-change", handleChange);
    return () => window.removeEventListener("print-queue-change", handleChange);
  }, []);

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        const showBadge = item.href === "/print-queue" && printQueueCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
            {showBadge && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-xs"
              >
                {printQueueCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

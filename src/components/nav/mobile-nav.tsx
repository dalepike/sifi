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

export function MobileNav() {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const showBadge = item.href === "/print-queue" && printQueueCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-4 min-w-4 justify-center px-1 text-[10px]"
                  >
                    {printQueueCount}
                  </Badge>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

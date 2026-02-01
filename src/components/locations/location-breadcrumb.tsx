"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Location } from "@/types/domain";

interface LocationBreadcrumbProps {
  path: Location[];
  onNavigate?: (location: Location | null) => void;
  compact?: boolean;
}

export function LocationBreadcrumb({ path, onNavigate, compact }: LocationBreadcrumbProps) {
  if (path.length === 0) {
    return null;
  }

  const handleClick = (location: Location | null) => {
    if (onNavigate) {
      onNavigate(location);
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {onNavigate ? (
            <BreadcrumbLink asChild>
              <button onClick={() => handleClick(null)} className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Locations</span>
              </button>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/locations" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Locations</span>
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {path.map((location, index) => {
          const isLast = index === path.length - 1;

          const content = compact ? (
            <span className="font-mono text-xs">{location.code}</span>
          ) : (
            <>
              <span className="font-mono text-xs">{location.code}</span>
              <span>{location.name}</span>
            </>
          );

          return (
            <Fragment key={location.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {content}
                  </BreadcrumbPage>
                ) : onNavigate ? (
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => handleClick(location)}
                      className="flex items-center gap-1"
                    >
                      {content}
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/locations/${location.id}`}
                      className="flex items-center gap-1"
                    >
                      {content}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

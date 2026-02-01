"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Home, MapPin, Box } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Location, Item } from "@/types/domain";

interface ItemBreadcrumbProps {
  locationPath: Location[];
  containerPath: Item[];
  currentItemName: string;
}

export function ItemBreadcrumb({
  locationPath,
  containerPath,
  currentItemName,
}: ItemBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home / Locations */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/locations" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Locations</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Location hierarchy */}
        {locationPath.map((location) => (
          <Fragment key={location.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/locations/${location.id}`}
                  className="flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{location.name}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}

        {/* Container hierarchy */}
        {containerPath.map((container) => (
          <Fragment key={container.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/items/${container.id}`}
                  className="flex items-center gap-1"
                >
                  <Box className="h-3 w-3" />
                  <span>{container.name}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}

        {/* Current item */}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium">
            {currentItemName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

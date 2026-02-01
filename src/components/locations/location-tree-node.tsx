"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Location } from "@/types/domain";

interface LocationTreeNodeProps {
  location: Location;
  depth: number;
  childCounts?: { locations: number; items: number };
  isSelected?: boolean;
  onSelect: (location: Location) => void;
  onAddChild: (parentId: string) => void;
  children?: React.ReactNode;
}

export function LocationTreeNode({
  location,
  depth,
  childCounts,
  isSelected,
  onSelect,
  onAddChild,
  children,
}: LocationTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = childCounts && childCounts.locations > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pr-2 hover:bg-accent",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </Button>

        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(location)}
        >
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{location.name}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            {location.code}
          </span>
          {childCounts && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {childCounts.locations > 0 && `${childCounts.locations} loc`}
              {childCounts.locations > 0 && childCounts.items > 0 && ", "}
              {childCounts.items > 0 && `${childCounts.items} items`}
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={() => onAddChild(location.id)}
          title="Add child location"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && hasChildren && <div>{children}</div>}
    </div>
  );
}

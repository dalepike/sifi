"use client";

import { ChevronRight, ChevronDown, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Location } from "@/types/domain";

interface LocationTreeNodeProps {
  location: Location;
  depth: number;
  childCounts?: { locations: number; items: number };
  isSelected?: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onSelect: (location: Location) => void;
  onToggleExpand: () => void;
  onAddChild: (parentId: string) => void;
  children?: React.ReactNode;
}

export function LocationTreeNode({
  location,
  depth,
  childCounts,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggleExpand,
  onAddChild,
  children,
}: LocationTreeNodeProps) {
  return (
    <div className="relative">
      {/* Tree line connector */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 h-full border-l border-border"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded-md py-1.5 pr-2 transition-all duration-200",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onToggleExpand}
          disabled={!hasChildren}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
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
          {location.icon ? (
            <span className="text-base leading-none shrink-0">{location.icon}</span>
          ) : (
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium">{location.name}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            {location.code}
          </span>
          {childCounts && (childCounts.locations > 0 || childCounts.items > 0) && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {childCounts.locations > 0 && (
                <>
                  {childCounts.locations} {depth === 0 ? "room" : "spot"}{childCounts.locations !== 1 ? "s" : ""}
                </>
              )}
              {childCounts.locations > 0 && childCounts.items > 0 && ", "}
              {childCounts.items > 0 && (
                <>
                  {childCounts.items} item{childCounts.items !== 1 ? "s" : ""}
                </>
              )}
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={() => onAddChild(location.id)}
          aria-label={`Add child to ${location.name}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && hasChildren && (
        <div className="transition-all duration-200">{children}</div>
      )}
    </div>
  );
}

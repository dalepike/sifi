"use client";

import Link from "next/link";
import { Package, Box, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Item } from "@/types/domain";

interface ItemCardProps {
  item: Item;
  childCount?: number;
  isSelected?: boolean;
  selectionMode?: boolean;
  isChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function ItemCard({
  item,
  childCount,
  isSelected,
  selectionMode,
  isChecked,
  onCheckedChange,
}: ItemCardProps) {
  const isContainer = item.type === "container";
  const Icon = isContainer ? Box : Package;

  const cardContent = (
    <>
      {selectionMode && (
        <div
          className="shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCheckedChange?.(!isChecked);
          }}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
            aria-label={`Select ${item.name}`}
          />
        </div>
      )}

      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
          isContainer ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{item.name}</span>
          <Badge variant={isContainer ? "default" : "secondary"} className="shrink-0">
            {isContainer ? "Container" : "Object"}
          </Badge>
        </div>
        {item.description && (
          <p className="truncate text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {isContainer && childCount !== undefined && childCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {childCount} item{childCount !== 1 && "s"} inside
          </p>
        )}
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </>
  );

  const cardClasses = cn(
    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
    "hover:bg-accent cursor-pointer",
    isSelected && "border-primary bg-accent",
    isChecked && "bg-accent/50 border-primary"
  );

  if (selectionMode) {
    return (
      <div
        className={cardClasses}
        onClick={() => onCheckedChange?.(!isChecked)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/items/${item.id}`}>
      <div className={cardClasses}>
        {cardContent}
      </div>
    </Link>
  );
}

"use client";

import { Tag as TagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tag, TagWithItemCount } from "@/types/domain";

interface TagCardProps {
  tag: Tag | TagWithItemCount;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TagCard({ tag, isSelected, onClick }: TagCardProps) {
  const itemCount = "itemCount" in tag ? tag.itemCount : undefined;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: tag.color }}
        >
          <TagIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{tag.name}</p>
          {tag.description ? (
            <p className="truncate text-sm text-muted-foreground">
              {tag.description}
            </p>
          ) : itemCount !== undefined ? (
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

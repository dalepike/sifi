"use client";

import { useEffect, useState } from "react";
import { Package, Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getActivityItems, removeItemFromActivity } from "@/actions/activity-items";
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import type { ItemWithLocation } from "@/types/domain";

interface ActivityItemsListProps {
  activityId: string;
}

export function ActivityItemsList({ activityId }: ActivityItemsListProps) {
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getActivityItems(activityId);
      if (result.success) {
        setItems(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    load();
  }, [activityId]);

  const handleRemove = async (itemId: string) => {
    const result = await removeItemFromActivity(activityId, itemId);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">{error}</div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No items in this activity yet.
        <br />
        <span className="text-xs">Add items from their detail pages.</span>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.type === "container" ? Box : Package;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.name}</span>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {item.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{item.humanReadableCode}</span>
              </div>
              {item.locationPath.length > 0 && (
                <div className="text-xs">
                  <LocationBreadcrumb path={item.locationPath} compact />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(item.id)}
              title="Remove from activity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

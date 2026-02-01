"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "./item-card";
import { getItemsInLocation, getItemsInContainer } from "@/actions/items";
import type { Item } from "@/types/domain";

interface ItemListProps {
  parentType: "location" | "item";
  parentId: string;
  selectedId?: string;
  onAdd: () => void;
}

export function ItemList({
  parentType,
  parentId,
  selectedId,
  onAdd,
}: ItemListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [childCounts, setChildCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);

      const result =
        parentType === "location"
          ? await getItemsInLocation(parentId)
          : await getItemsInContainer(parentId);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setItems(result.data);

      // Load child counts for containers
      const containers = result.data.filter((item) => item.type === "container");
      const counts: Record<string, number> = {};

      // Note: This would be better done server-side, but for simplicity we fetch here
      // In production, you'd want a batch endpoint
      for (const container of containers) {
        const childResult = await getItemsInContainer(container.id);
        if (childResult.success) {
          counts[container.id] = childResult.data.length;
        }
      }

      setChildCounts(counts);
      setLoading(false);
    }

    loadItems();
  }, [parentType, parentId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Items ({items.length})
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-muted-foreground">No items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first item to this{" "}
            {parentType === "location" ? "location" : "container"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              childCount={childCounts[item.id]}
              isSelected={selectedId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

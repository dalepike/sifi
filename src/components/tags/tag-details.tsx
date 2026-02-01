"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Tag as TagIcon, Trash2, Package, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getTagWithItemCount, deleteTag, getTagItems } from "@/actions/tags";
import type { Tag, ItemWithLocation } from "@/types/domain";

interface TagDetailsProps {
  tagId: string;
  onEdit: (tag: Tag) => void;
  onDelete: () => void;
}

export function TagDetails({
  tagId,
  onEdit,
  onDelete,
}: TagDetailsProps) {
  const [tag, setTag] = useState<(Tag & { itemCount: number }) | null>(null);
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const tagResult = await getTagWithItemCount(tagId);
      if (!tagResult.success) {
        setError(tagResult.error);
        setLoading(false);
        return;
      }

      setTag(tagResult.data);

      // Load items with this tag
      const itemsResult = await getTagItems(tagId);
      if (itemsResult.success) {
        setItems(itemsResult.data);
      }

      setLoading(false);
    }

    load();
  }, [tagId]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTag(tagId);
    if (result.success) {
      onDelete();
    } else {
      setError(result.error);
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !tag) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-destructive">{error || "Tag not found"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: tag.color }}
          >
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle>{tag.name}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              {tag.color}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tag.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{tag.description}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground">Items</p>
          <p className="text-sm">
            {tag.itemCount} {tag.itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Tagged Items</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  {item.type === "container" ? (
                    <Box className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{item.name}</span>
                  <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                    {item.humanReadableCode}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p className="text-sm">
            {new Date(tag.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(tag)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{tag.name}&quot;?
                  {tag.itemCount > 0 && (
                    <>
                      {" "}
                      This tag is applied to {tag.itemCount}{" "}
                      {tag.itemCount === 1 ? "item" : "items"} that will
                      become untagged.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

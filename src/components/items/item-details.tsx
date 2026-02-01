"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Package, Box, Copy } from "lucide-react";
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
import { getItem, deleteItem, getItemsInContainer } from "@/actions/items";
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import type { Item, ItemWithLocation } from "@/types/domain";

interface ItemDetailsProps {
  itemId: string;
  onEdit: (item: Item) => void;
  onDelete: () => void;
  onNavigateToContainer?: (item: Item) => void;
}

export function ItemDetails({
  itemId,
  onEdit,
  onDelete,
  onNavigateToContainer,
}: ItemDetailsProps) {
  const [item, setItem] = useState<ItemWithLocation | null>(null);
  const [childCount, setChildCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const result = await getItem(itemId);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setItem(result.data);

      // Get child count if container
      if (result.data.type === "container") {
        const childResult = await getItemsInContainer(itemId);
        if (childResult.success) {
          setChildCount(childResult.data.length);
        }
      }

      setLoading(false);
    }

    load();
  }, [itemId]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteItem(itemId);
    setDeleting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onDelete();
  };

  const handleCopyCode = () => {
    if (item) {
      navigator.clipboard.writeText(item.humanReadableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error || "Item not found"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isContainer = item.type === "container";
  const Icon = isContainer ? Box : Package;
  const canDelete = !isContainer || childCount === 0;

  // Parse photos if present
  let photos: string[] = [];
  if (item.photos) {
    try {
      photos = JSON.parse(item.photos);
    } catch {
      // If not JSON, treat as single photo
      photos = [item.photos];
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {item.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isContainer ? "default" : "secondary"}>
              {isContainer ? "Container" : "Object"}
            </Badge>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-xs hover:bg-muted/80"
              title="Copy code"
            >
              {item.humanReadableCode}
              <Copy className="h-3 w-3" />
            </button>
            {copied && (
              <span className="text-xs text-muted-foreground">Copied!</span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={!canDelete}
                title={
                  canDelete
                    ? "Delete item"
                    : "Cannot delete: container has items"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{item.name}&quot;? This
                  action cannot be undone.
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
      </CardHeader>
      <CardContent className="space-y-4">
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}

        {/* Photo gallery */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Photos</p>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={photo}
                    alt={`${item.name} photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location path */}
        {item.locationPath.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Location</p>
            <LocationBreadcrumb path={item.locationPath} />
          </div>
        )}

        {/* Container contents summary */}
        {isContainer && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>
              {childCount} item{childCount !== 1 && "s"} inside
            </span>
            {childCount > 0 && onNavigateToContainer && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => onNavigateToContainer(item)}
              >
                View contents
              </Button>
            )}
          </div>
        )}

        <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <p>
            Created:{" "}
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
          <p>
            Updated:{" "}
            {new Date(item.updatedAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

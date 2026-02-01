"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Tag as TagIcon,
  Package,
  Box,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TagFormDialog } from "@/components/tags";
import type { Tag, TagWithItemCount, ItemWithLocation } from "@/types/domain";

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tagId = params.id as string;

  const [tag, setTag] = useState<TagWithItemCount | null>(null);
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTag = useCallback(async () => {
    setLoading(true);
    setError(null);

    const tagResult = await getTagWithItemCount(tagId);
    if (!tagResult.success) {
      setError(tagResult.error);
      setLoading(false);
      return;
    }

    setTag(tagResult.data);

    const itemsResult = await getTagItems(tagId);
    if (itemsResult.success) {
      setItems(itemsResult.data);
    }

    setLoading(false);
  }, [tagId]);

  useEffect(() => {
    loadTag();
  }, [loadTag]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTag(tagId);
    if (result.success) {
      router.push("/tags");
    } else {
      setError(result.error);
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setDialogOpen(false);
    loadTag();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tag) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tags">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tags
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error || "Tag not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tags">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: tag.color }}
          >
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tag.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tag.itemCount} {tag.itemCount === 1 ? "item" : "items"}
              {tag.description && ` · ${tag.description}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
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
                      {tag.itemCount === 1 ? "item" : "items"} that will become
                      untagged.
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
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TagIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No items with this tag</p>
            <p className="text-muted-foreground">
              Add this tag to items from their detail page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {item.type === "container" ? (
                      <Box className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{item.name}</p>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {item.humanReadableCode}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.locationPath.map((l) => l.name).join(" → ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <TagFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={tag}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Package, Box, Copy, Activity, Tag, Plus, X, Move, Printer, Check } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getItem, deleteItem, getItemsInContainer } from "@/actions/items";
import {
  getItemActivities,
  addItemToActivity,
  removeItemFromActivity,
} from "@/actions/activity-items";
import { getItemTags, addTagToItem, removeTagFromItem } from "@/actions/item-tags";
import { getActivities } from "@/actions/activities";
import { getTags } from "@/actions/tags";
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import { MoveItemDialog } from "@/components/items/move-item-dialog";
import { ItemQRCode } from "@/components/items/item-qr-code";
import type { Item, ItemWithLocation, Activity as ActivityType, Tag as TagType } from "@/types/domain";
import { addToPrintQueue, isInPrintQueue } from "@/lib/print-queue";

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

  // Activities
  const [itemActivities, setItemActivities] = useState<
    { id: string; name: string }[]
  >([]);
  const [allActivities, setAllActivities] = useState<ActivityType[]>([]);
  const [activityPopoverOpen, setActivityPopoverOpen] = useState(false);

  // Tags
  const [itemTags, setItemTags] = useState<TagType[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  // Move dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Print queue
  const [inPrintQueue, setInPrintQueue] = useState(false);

  const loadItemData = async () => {
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

    // Get activities this item belongs to
    const activitiesResult = await getItemActivities(itemId);
    if (activitiesResult.success) {
      setItemActivities(activitiesResult.data);
    }

    // Get tags for this item
    const tagsResult = await getItemTags(itemId);
    if (tagsResult.success) {
      setItemTags(tagsResult.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadItemData();
    setInPrintQueue(isInPrintQueue(itemId));
  }, [itemId]);

  const loadActivitiesForPopover = async () => {
    const result = await getActivities("active");
    if (result.success) {
      setAllActivities(result.data);
    }
  };

  const loadTagsForPopover = async () => {
    const result = await getTags();
    if (result.success) {
      setAllTags(result.data);
    }
  };

  const handleAddToActivity = async (activityId: string) => {
    const result = await addItemToActivity(activityId, itemId);
    if (result.success) {
      // Reload item activities
      const activitiesResult = await getItemActivities(itemId);
      if (activitiesResult.success) {
        setItemActivities(activitiesResult.data);
      }
      setActivityPopoverOpen(false);
    }
  };

  const handleRemoveFromActivity = async (activityId: string) => {
    const result = await removeItemFromActivity(activityId, itemId);
    if (result.success) {
      setItemActivities((prev) => prev.filter((a) => a.id !== activityId));
    }
  };

  const handleAddTag = async (tagId: string) => {
    const result = await addTagToItem(itemId, tagId);
    if (result.success) {
      // Reload item tags
      const tagsResult = await getItemTags(itemId);
      if (tagsResult.success) {
        setItemTags(tagsResult.data);
      }
      setTagPopoverOpen(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const result = await removeTagFromItem(itemId, tagId);
    if (result.success) {
      setItemTags((prev) => prev.filter((t) => t.id !== tagId));
    }
  };

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
          <Button
            variant={inPrintQueue ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              addToPrintQueue(item.id);
              setInPrintQueue(true);
            }}
            disabled={inPrintQueue}
            title={inPrintQueue ? "In print queue" : "Add to print queue"}
          >
            {inPrintQueue ? <Check className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMoveDialogOpen(true)}
            title="Move item"
          >
            <Move className="h-4 w-4" />
          </Button>
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

        {/* QR Code */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">QR Code</p>
          <ItemQRCode itemId={item.id} humanReadableCode={item.humanReadableCode} />
        </div>

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

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </p>
            <Popover open={tagPopoverOpen} onOpenChange={(open) => {
              setTagPopoverOpen(open);
              if (open) loadTagsForPopover();
            }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  {allTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      No tags available
                    </p>
                  ) : (
                    allTags
                      .filter((t) => !itemTags.some((it) => it.id === t.id))
                      .map((tag) => (
                        <button
                          key={tag.id}
                          className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-accent text-left"
                          onClick={() => handleAddTag(tag.id)}
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="truncate">{tag.name}</span>
                        </button>
                      ))
                  )}
                  {allTags.length > 0 &&
                    allTags.filter((t) => !itemTags.some((it) => it.id === t.id))
                      .length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">
                        All tags applied
                      </p>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {itemTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {itemTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="gap-1 pr-1"
                  style={{
                    borderColor: tag.color,
                    borderWidth: "1px",
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    title="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Activities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Activities
            </p>
            <Popover open={activityPopoverOpen} onOpenChange={(open) => {
              setActivityPopoverOpen(open);
              if (open) loadActivitiesForPopover();
            }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  {allActivities.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      No active activities
                    </p>
                  ) : (
                    allActivities
                      .filter((a) => !itemActivities.some((ia) => ia.id === a.id))
                      .map((activity) => (
                        <button
                          key={activity.id}
                          className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-accent text-left"
                          onClick={() => handleAddToActivity(activity.id)}
                        >
                          <div className="h-2.5 w-2.5 rounded-full shrink-0 bg-slate-500" />
                          <span className="truncate">{activity.name}</span>
                        </button>
                      ))
                  )}
                  {allActivities.length > 0 &&
                    allActivities.filter((a) => !itemActivities.some((ia) => ia.id === a.id))
                      .length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">
                        Already in all activities
                      </p>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {itemActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground">Not in any activities</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {itemActivities.map((activity) => (
                <Badge
                  key={activity.id}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {activity.name}
                  <button
                    onClick={() => handleRemoveFromActivity(activity.id)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    title="Remove from activity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

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

      <MoveItemDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        itemId={item.id}
        itemName={item.name}
        currentLocationPath={item.locationPath}
        onSuccess={loadItemData}
      />
    </Card>
  );
}

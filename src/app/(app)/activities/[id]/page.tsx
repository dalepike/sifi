"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Activity as ActivityIcon,
  Archive,
  RotateCcw,
  Package,
  Box,
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
import {
  getActivityWithItemCount,
  deleteActivity,
  archiveActivity,
  unarchiveActivity,
} from "@/actions/activities";
import { getActivityItems } from "@/actions/activity-items";
import { ActivityFormDialog } from "@/components/activities";
import type { Activity, ActivityWithItemCount, ItemWithLocation } from "@/types/domain";

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityWithItemCount | null>(null);
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    const activityResult = await getActivityWithItemCount(activityId);
    if (!activityResult.success) {
      setError(activityResult.error);
      setLoading(false);
      return;
    }

    setActivity(activityResult.data);

    const itemsResult = await getActivityItems(activityId);
    if (itemsResult.success) {
      setItems(itemsResult.data);
    }

    setLoading(false);
  }, [activityId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteActivity(activityId);
    if (result.success) {
      router.push("/activities");
    } else {
      setError(result.error);
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    const result = await archiveActivity(activityId);
    if (result.success) {
      loadActivity();
    } else {
      setError(result.error);
    }
    setArchiving(false);
  };

  const handleUnarchive = async () => {
    setArchiving(true);
    const result = await unarchiveActivity(activityId);
    if (result.success) {
      loadActivity();
    } else {
      setError(result.error);
    }
    setArchiving(false);
  };

  const handleEditSuccess = () => {
    setDialogOpen(false);
    loadActivity();
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

  if (error || !activity) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error || "Activity not found"}
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
            <Link href="/activities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-500">
            {activity.status === "archived" ? (
              <Archive className="h-6 w-6 text-white" />
            ) : (
              <ActivityIcon className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{activity.name}</h1>
              {activity.status === "archived" && (
                <Badge variant="secondary">Archived</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {activity.itemCount} {activity.itemCount === 1 ? "item" : "items"}
              {activity.description && ` · ${activity.description}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          {activity.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={archiving}
            >
              <Archive className="mr-2 h-4 w-4" />
              {archiving ? "Archiving..." : "Archive"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnarchive}
              disabled={archiving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {archiving ? "Restoring..." : "Restore"}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{activity.name}&quot;?
                  {activity.itemCount > 0 && (
                    <>
                      {" "}
                      This activity has {activity.itemCount}{" "}
                      {activity.itemCount === 1 ? "item" : "items"} associated.
                      The items will not be deleted, only the association.
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
            <ActivityIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No items in this activity</p>
            <p className="text-muted-foreground">
              Add items to this activity from their detail page
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

      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={activity}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { getIconComponent } from "./activity-form-dialog";
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
  getActivityWithItemCount,
  deleteActivity,
  archiveActivity,
  unarchiveActivity,
} from "@/actions/activities";
import { ActivityItemsList } from "./activity-items-list";
import type { Activity, ActivityWithItemCount } from "@/types/domain";

interface ActivityDetailsProps {
  activityId: string;
  onEdit: (activity: Activity) => void;
  onDelete: () => void;
  onStatusChange: () => void;
}

export function ActivityDetails({
  activityId,
  onEdit,
  onDelete,
  onStatusChange,
}: ActivityDetailsProps) {
  const [activity, setActivity] = useState<ActivityWithItemCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const result = await getActivityWithItemCount(activityId);
      if (result.success) {
        setActivity(result.data);
      } else {
        setError(result.error);
      }

      setLoading(false);
    }

    load();
  }, [activityId]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteActivity(activityId);
    if (result.success) {
      onDelete();
    } else {
      setError(result.error);
    }
    setDeleting(false);
  };

  const handleArchive = async () => {
    setArchiving(true);
    const result = await archiveActivity(activityId);
    if (result.success) {
      onStatusChange();
    } else {
      setError(result.error);
    }
    setArchiving(false);
  };

  const handleUnarchive = async () => {
    setArchiving(true);
    const result = await unarchiveActivity(activityId);
    if (result.success) {
      onStatusChange();
    } else {
      setError(result.error);
    }
    setArchiving(false);
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

  if (error || !activity) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-destructive">{error || "Activity not found"}</div>
        </CardContent>
      </Card>
    );
  }

  const ActivityIconComponent = getIconComponent(activity.icon);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: activity.color }}
          >
            {activity.status === "archived" ? (
              <Archive className="h-6 w-6 text-white" />
            ) : (
              <ActivityIconComponent className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{activity.name}</CardTitle>
              {activity.status === "archived" && (
                <Badge variant="secondary">Archived</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Items ({activity.itemCount})
          </p>
          <ActivityItemsList activityId={activity.id} />
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p className="text-sm">
            {new Date(activity.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
          <p className="text-sm">
            {new Date(activity.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(activity)}>
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
                      {activity.itemCount === 1 ? "item" : "items"} associated. The
                      items will not be deleted, only the association.
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

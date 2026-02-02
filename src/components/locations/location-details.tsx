"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, MapPin, FolderTree, Package } from "lucide-react";
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
import { getLocation, getLocationChildren, deleteLocation } from "@/actions/locations";
import { LocationBreadcrumb } from "./location-breadcrumb";
import type { Location, LocationWithPath } from "@/types/domain";

interface LocationDetailsProps {
  locationId: string;
  onEdit: (location: Location) => void;
  onDelete: () => void;
}

export function LocationDetails({
  locationId,
  onEdit,
  onDelete,
}: LocationDetailsProps) {
  const [location, setLocation] = useState<LocationWithPath | null>(null);
  const [counts, setCounts] = useState<{ locations: number; items: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [locationResult, childResult] = await Promise.all([
        getLocation(locationId),
        getLocationChildren(locationId),
      ]);

      if (!locationResult.success) {
        setError(locationResult.error);
        setLoading(false);
        return;
      }

      setLocation(locationResult.data);
      setCounts(childResult.success ? childResult.data.counts : null);
      setLoading(false);
    }

    load();
  }, [locationId]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteLocation(locationId);
    setDeleting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onDelete();
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
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !location) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error || "Location not found"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const canDelete = counts && counts.locations === 0 && counts.items === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {location.icon ? (
              <span className="text-2xl leading-none">{location.icon}</span>
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            {location.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {location.code}
            </Badge>
            {location.locationType && (
              <Badge variant="outline" className="capitalize">
                {location.locationType}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(location)}>
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
                    ? "Delete location"
                    : "Cannot delete: location has children"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Location</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{location.name}&quot;? This
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
        {location.description && (
          <p className="text-sm text-muted-foreground">{location.description}</p>
        )}

        {location.path.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Path</p>
            <LocationBreadcrumb path={location.path.slice(0, -1)} />
          </div>
        )}

        {counts && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <span>
                {counts.locations} sub-location{counts.locations !== 1 && "s"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>
                {counts.items} item{counts.items !== 1 && "s"}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <p>
            Created:{" "}
            {new Date(location.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
          <p>
            Updated:{" "}
            {new Date(location.updatedAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

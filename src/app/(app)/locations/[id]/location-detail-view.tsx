"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Package,
  Box,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { deleteLocation, getLocationChildren } from "@/actions/locations";
import { getItemsInLocation } from "@/actions/items";
import type { LocationWithPath, Location, Item } from "@/types/domain";

interface LocationDetailViewProps {
  location: LocationWithPath;
}

export function LocationDetailView({ location: initialLocation }: LocationDetailViewProps) {
  const router = useRouter();
  const [location] = useState(initialLocation);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [childLocations, setChildLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items and child locations
  useEffect(() => {
    async function load() {
      setLoading(true);

      const [itemsResult, childrenResult] = await Promise.all([
        getItemsInLocation(location.id),
        getLocationChildren(location.id),
      ]);

      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
      if (childrenResult.success) {
        setChildLocations(childrenResult.data.children);
      }

      setLoading(false);
    }

    load();
  }, [location.id]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteLocation(location.id);
    setDeleting(false);

    if (result.success) {
      router.push("/locations");
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    router.refresh();
  };

  const handleItemSuccess = () => {
    setItemDialogOpen(false);
    router.refresh();
  };

  const canDelete = items.length === 0 && childLocations.length === 0;

  // Build breadcrumb path (exclude current location from path)
  const breadcrumbPath = location.path.slice(0, -1);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/locations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          {breadcrumbPath.length > 0 ? (
            <LocationBreadcrumb path={breadcrumbPath} />
          ) : (
            <Link href="/locations" className="text-sm text-muted-foreground hover:text-foreground">
              ← All Locations
            </Link>
          )}
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="h-6 w-6" />
              {location.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {location.code}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditDialogOpen(true)}
              title="Edit location"
            >
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
                      : "Cannot delete: location has items or sub-locations"
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

        <CardContent className="space-y-6">
          {/* Description */}
          {location.description && (
            <p className="text-muted-foreground">{location.description}</p>
          )}

          {/* Child Locations */}
          {childLocations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Sub-locations ({childLocations.length})
              </h3>
              <div className="space-y-1">
                {childLocations.map((child) => (
                  <Link key={child.id} href={`/locations/${child.id}`}>
                    <div className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent transition-colors">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{child.name}</p>
                        {child.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {child.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="font-mono shrink-0">
                        {child.code}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Items ({items.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this location</p>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent transition-colors">
                      {item.type === "container" ? (
                        <Box className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={item.type === "container" ? "default" : "secondary"} className="shrink-0">
                        {item.type === "container" ? "Container" : "Object"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
            <p>ID: {location.id}</p>
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

      {/* Edit Dialog */}
      <LocationFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        location={location}
        onSuccess={handleEditSuccess}
      />

      {/* Add Item Dialog */}
      <ItemFormDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        parentLocationId={location.id}
        onSuccess={handleItemSuccess}
      />
    </div>
  );
}

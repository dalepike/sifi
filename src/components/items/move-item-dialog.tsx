"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ChevronRight, Folder, Box, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllLocations } from "@/actions/locations";
import { moveItem, getContainers } from "@/actions/items";
import type { Location, ItemWithLocation } from "@/types/domain";

interface MoveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentLocationPath: Location[];
  onSuccess: () => void;
}

type MoveTarget =
  | { type: "location"; location: Location }
  | { type: "container"; item: ItemWithLocation };

export function MoveItemDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentLocationPath,
  onSuccess,
}: MoveItemDialogProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [containers, setContainers] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation state for location hierarchy
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [locationPath, setLocationPath] = useState<Location[]>([]);

  // Selected target
  const [selectedTarget, setSelectedTarget] = useState<MoveTarget | null>(null);

  // Load locations and containers
  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setError(null);

      // Load all locations
      const locResult = await getAllLocations();
      if (locResult.success) {
        setLocations(locResult.data.locations);
      }

      // Load all containers
      const containerResult = await getContainers();
      if (containerResult.success) {
        // Exclude the current item from the list
        setContainers(
          containerResult.data.filter((item) => item.id !== itemId)
        );
      }

      setLoading(false);
    }

    load();
    // Reset state when dialog opens
    setCurrentLocationId(null);
    setLocationPath([]);
    setSelectedTarget(null);
  }, [open, itemId]);

  // Get child locations of current location
  const childLocations = locations.filter(
    (loc) => loc.parentId === currentLocationId
  );

  // Navigate into a location
  const navigateToLocation = useCallback((location: Location) => {
    setCurrentLocationId(location.id);
    setLocationPath((prev) => [...prev, location]);
    setSelectedTarget(null);
  }, []);

  // Navigate up in the hierarchy
  const navigateUp = useCallback((index: number) => {
    if (index < 0) {
      setCurrentLocationId(null);
      setLocationPath([]);
    } else {
      const targetLocation = locationPath[index]!;
      setCurrentLocationId(targetLocation.id);
      setLocationPath((prev) => prev.slice(0, index + 1));
    }
    setSelectedTarget(null);
  }, [locationPath]);

  // Select a location as target
  const selectLocation = useCallback((location: Location) => {
    setSelectedTarget({ type: "location", location });
  }, []);

  // Select a container as target
  const selectContainer = useCallback((container: ItemWithLocation) => {
    setSelectedTarget({ type: "container", item: container });
  }, []);

  // Check if move would change location prefix (for warning)
  const wouldChangePrefixChanged = useCallback(() => {
    if (!selectedTarget) return false;

    const currentPrefix = currentLocationPath
      .map((loc) => loc.code)
      .join("-");

    if (selectedTarget.type === "location") {
      // Build new path by walking up the location hierarchy
      const newPath: Location[] = [];
      let current: Location | undefined = selectedTarget.location;
      while (current) {
        newPath.unshift(current);
        current = locations.find((loc) => loc.id === current?.parentId);
      }
      const newPrefix = newPath.map((loc) => loc.code).join("-");
      return currentPrefix !== newPrefix;
    } else {
      // Moving to a container - check if that container's location differs
      const containerPrefix = selectedTarget.item.locationPath
        .map((loc) => loc.code)
        .join("-");
      return currentPrefix !== containerPrefix;
    }
  }, [selectedTarget, currentLocationPath, locations]);

  // Handle move
  const handleMove = async () => {
    if (!selectedTarget) return;

    setMoving(true);
    setError(null);

    const target =
      selectedTarget.type === "location"
        ? { locationId: selectedTarget.location.id }
        : { itemId: selectedTarget.item.id };

    const result = await moveItem(itemId, target);

    if (result.success) {
      onSuccess();
      onOpenChange(false);
    } else {
      setError(result.error);
    }

    setMoving(false);
  };

  const prefixChanged = wouldChangePrefixChanged();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move &quot;{itemName}&quot;</DialogTitle>
          <DialogDescription>
            Select a new location or container for this item.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="locations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="containers">Containers</TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="mt-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm mb-3 flex-wrap">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigateUp(-1)}
                >
                  Root
                </button>
                {locationPath.map((loc, index) => (
                  <span key={loc.id} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => navigateUp(index)}
                    >
                      {loc.name}
                    </button>
                  </span>
                ))}
              </div>

              <ScrollArea className="h-[250px] rounded-md border p-2">
                {childLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {currentLocationId
                      ? "No child locations"
                      : "No locations. Create locations first."}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {childLocations.map((location) => (
                      <div
                        key={location.id}
                        className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
                          selectedTarget?.type === "location" &&
                          selectedTarget.location.id === location.id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => selectLocation(location)}
                        >
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {location.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({location.code})
                          </span>
                        </button>
                        {locations.some((l) => l.parentId === location.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => navigateToLocation(location)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Select current level button */}
              {currentLocationId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    const current = locations.find(
                      (l) => l.id === currentLocationId
                    );
                    if (current) selectLocation(current);
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to &quot;
                  {locationPath[locationPath.length - 1]?.name}&quot;
                </Button>
              )}
            </TabsContent>

            <TabsContent value="containers" className="mt-4">
              <ScrollArea className="h-[280px] rounded-md border p-2">
                {containers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No containers available.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {containers.map((container) => (
                      <button
                        key={container.id}
                        className={`flex items-start gap-2 w-full rounded-md px-3 py-2 text-left transition-colors ${
                          selectedTarget?.type === "container" &&
                          selectedTarget.item.id === container.id
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => selectContainer(container)}
                      >
                        <Box className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {container.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {container.locationPath.length > 0
                              ? container.locationPath
                                  .map((l) => l.name)
                                  .join(" → ")
                              : "No location"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Warning if location prefix changes */}
        {selectedTarget && prefixChanged && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm mt-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Moving this item will change its location code prefix. Any printed
              labels will no longer match.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!selectedTarget || moving}>
            {moving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Moving...
              </>
            ) : (
              "Move Here"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

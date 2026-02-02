"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ChevronRight, Folder, Box, Loader2 } from "lucide-react";
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
import { getContainers } from "@/actions/items";
import { batchMoveItems } from "@/actions/batch-items";
import type { Location, ItemWithLocation } from "@/types/domain";

interface BatchMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemIds: string[];
  onSuccess: () => void;
}

type MoveTarget =
  | { type: "location"; location: Location }
  | { type: "container"; item: ItemWithLocation };

export function BatchMoveDialog({
  open,
  onOpenChange,
  itemIds,
  onSuccess,
}: BatchMoveDialogProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [containers, setContainers] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [locationPath, setLocationPath] = useState<Location[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<MoveTarget | null>(null);

  const count = itemIds.length;

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setError(null);

      const locResult = await getAllLocations();
      if (locResult.success) {
        setLocations(locResult.data.locations);
      }

      const containerResult = await getContainers();
      if (containerResult.success) {
        // Exclude any of the selected items from containers
        setContainers(
          containerResult.data.filter((item) => !itemIds.includes(item.id))
        );
      }

      setLoading(false);
    }

    load();
    setCurrentLocationId(null);
    setLocationPath([]);
    setSelectedTarget(null);
  }, [open, itemIds]);

  const childLocations = locations.filter(
    (loc) => loc.parentId === currentLocationId
  );

  const navigateToLocation = useCallback((location: Location) => {
    setCurrentLocationId(location.id);
    setLocationPath((prev) => [...prev, location]);
    setSelectedTarget(null);
  }, []);

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

  const selectLocation = useCallback((location: Location) => {
    setSelectedTarget({ type: "location", location });
  }, []);

  const selectContainer = useCallback((container: ItemWithLocation) => {
    setSelectedTarget({ type: "container", item: container });
  }, []);

  const handleMove = async () => {
    if (!selectedTarget) return;

    setMoving(true);
    setError(null);

    const targetLocationId = selectedTarget.type === "location"
      ? selectedTarget.location.id
      : null;
    const targetItemId = selectedTarget.type === "container"
      ? selectedTarget.item.id
      : null;

    const result = await batchMoveItems(itemIds, targetLocationId, targetItemId);

    if (result.success) {
      onSuccess();
      onOpenChange(false);
    } else {
      setError(result.error);
    }

    setMoving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move {count} items</DialogTitle>
          <DialogDescription>
            Select a new location or container for the selected items.
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
                  Move to &quot;{locationPath[locationPath.length - 1]?.name}&quot;
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
              `Move ${count} items`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

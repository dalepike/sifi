"use client";

import { useState, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationTree, type LocationTreeRef } from "./location-tree";
import { LocationDetails } from "./location-details";
import { LocationFormDialog } from "./location-form-dialog";
import { ItemList, ItemFormDialog } from "@/components/items";
import type { Location } from "@/types/domain";

export function LocationBrowser() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [itemListKey, setItemListKey] = useState(0);

  // Ref for refreshing tree without remounting
  const treeRef = useRef<LocationTreeRef>(null);

  const refreshTree = useCallback(() => {
    treeRef.current?.refresh();
  }, []);

  const handleSelectLocation = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const handleAddLocationChild = useCallback((parentId: string | null) => {
    setParentIdForNew(parentId);
    setEditingLocation(null);
    setLocationDialogOpen(true);
  }, []);

  const handleEditLocation = useCallback((location: Location) => {
    setEditingLocation(location);
    setParentIdForNew(null);
    setLocationDialogOpen(true);
  }, []);

  const handleLocationDialogClose = useCallback(() => {
    setLocationDialogOpen(false);
    setEditingLocation(null);
    setParentIdForNew(null);
  }, []);

  const handleLocationSuccess = useCallback(() => {
    handleLocationDialogClose();
    refreshTree();
    setItemListKey((k) => k + 1);
  }, [handleLocationDialogClose, refreshTree]);

  const handleLocationDelete = useCallback(() => {
    setSelectedLocation(null);
    refreshTree();
  }, [refreshTree]);

  // Item handlers
  const handleAddItem = useCallback(() => {
    if (selectedLocation) {
      setParentIdForNew(selectedLocation.id);
      setItemDialogOpen(true);
    }
  }, [selectedLocation]);

  const handleItemDialogClose = useCallback(() => {
    setItemDialogOpen(false);
  }, []);

  const handleItemSuccess = useCallback(() => {
    handleItemDialogClose();
    setItemListKey((k) => k + 1);
    refreshTree();
  }, [handleItemDialogClose, refreshTree]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {/* Location Tree */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Location Hierarchy</h2>
            <Button size="sm" onClick={() => handleAddLocationChild(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Root Location
            </Button>
          </div>
          <div className="rounded-lg border">
            <LocationTree
              ref={treeRef}
              selectedId={selectedLocation?.id}
              onSelect={handleSelectLocation}
              onAddChild={handleAddLocationChild}
            />
          </div>
        </div>

        {/* Items in selected location */}
        {selectedLocation && (
          <ItemList
            key={itemListKey}
            parentType="location"
            parentId={selectedLocation.id}
            onAdd={handleAddItem}
          />
        )}
      </div>

      {/* Details Panel - Location only */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {selectedLocation ? (
          <LocationDetails
            locationId={selectedLocation.id}
            onEdit={handleEditLocation}
            onDelete={handleLocationDelete}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              Select a location to view details
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LocationFormDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        location={editingLocation}
        parentId={parentIdForNew}
        onSuccess={handleLocationSuccess}
      />

      <ItemFormDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        parentLocationId={selectedLocation?.id ?? null}
        onSuccess={handleItemSuccess}
      />
    </div>
  );
}

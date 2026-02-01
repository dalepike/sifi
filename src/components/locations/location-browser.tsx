"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationTree } from "./location-tree";
import { LocationDetails } from "./location-details";
import { LocationFormDialog } from "./location-form-dialog";
import { ItemList, ItemDetails, ItemFormDialog } from "@/components/items";
import type { Location, Item } from "@/types/domain";

export function LocationBrowser() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [parentItemIdForNew, setParentItemIdForNew] = useState<string | null>(null);
  const [treeKey, setTreeKey] = useState(0);
  const [itemListKey, setItemListKey] = useState(0);

  // Breadcrumb trail for navigating into containers
  const [containerStack, setContainerStack] = useState<Item[]>([]);

  const handleSelectLocation = useCallback((location: Location) => {
    setSelectedLocation(location);
    setSelectedItem(null);
    setContainerStack([]);
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
    setTreeKey((k) => k + 1);
    setItemListKey((k) => k + 1);
  }, [handleLocationDialogClose]);

  const handleLocationDelete = useCallback(() => {
    setSelectedLocation(null);
    setTreeKey((k) => k + 1);
  }, []);

  // Item handlers
  const handleSelectItem = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  const handleAddItem = useCallback(() => {
    // Determine parent based on current context
    if (containerStack.length > 0) {
      setParentItemIdForNew(containerStack[containerStack.length - 1]!.id);
      setParentIdForNew(null);
    } else if (selectedLocation) {
      setParentIdForNew(selectedLocation.id);
      setParentItemIdForNew(null);
    }
    setEditingItem(null);
    setItemDialogOpen(true);
  }, [selectedLocation, containerStack]);

  const handleEditItem = useCallback((item: Item) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  }, []);

  const handleItemDialogClose = useCallback(() => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setParentItemIdForNew(null);
  }, []);

  const handleItemSuccess = useCallback(() => {
    handleItemDialogClose();
    setItemListKey((k) => k + 1);
    setTreeKey((k) => k + 1); // Refresh tree to update item counts
  }, [handleItemDialogClose]);

  const handleItemDelete = useCallback(() => {
    setSelectedItem(null);
    setItemListKey((k) => k + 1);
    setTreeKey((k) => k + 1);
  }, []);

  const handleNavigateToContainer = useCallback((item: Item) => {
    if (item.type === "container") {
      setContainerStack((prev) => [...prev, item]);
      setSelectedItem(null);
    }
  }, []);

  const handleNavigateBack = useCallback(() => {
    setContainerStack((prev) => prev.slice(0, -1));
    setSelectedItem(null);
  }, []);

  // Current parent context for item list
  const currentContainer = containerStack[containerStack.length - 1];
  const itemParentType = currentContainer ? "item" : "location";
  const itemParentId = currentContainer?.id ?? selectedLocation?.id;

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
              key={treeKey}
              selectedId={selectedLocation?.id}
              onSelect={handleSelectLocation}
              onAddChild={handleAddLocationChild}
            />
          </div>
        </div>

        {/* Items in selected location/container */}
        {selectedLocation && (
          <div className="space-y-4">
            {/* Container breadcrumb */}
            {containerStack.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setContainerStack([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {selectedLocation.name}
                </button>
                {containerStack.map((container, index) => (
                  <span key={container.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    {index === containerStack.length - 1 ? (
                      <span className="font-medium">{container.name}</span>
                    ) : (
                      <button
                        onClick={() =>
                          setContainerStack((prev) => prev.slice(0, index + 1))
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {container.name}
                      </button>
                    )}
                  </span>
                ))}
                {containerStack.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNavigateBack}
                    className="ml-2"
                  >
                    ← Back
                  </Button>
                )}
              </div>
            )}

            <ItemList
              key={itemListKey}
              parentType={itemParentType}
              parentId={itemParentId!}
              selectedId={selectedItem?.id}
              onSelect={handleSelectItem}
              onAdd={handleAddItem}
            />
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {selectedItem ? (
          <ItemDetails
            itemId={selectedItem.id}
            onEdit={handleEditItem}
            onDelete={handleItemDelete}
            onNavigateToContainer={handleNavigateToContainer}
          />
        ) : selectedLocation ? (
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
        item={editingItem}
        parentLocationId={!currentContainer ? selectedLocation?.id : null}
        parentItemId={currentContainer?.id}
        onSuccess={handleItemSuccess}
      />
    </div>
  );
}

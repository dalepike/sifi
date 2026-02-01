"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationTree } from "./location-tree";
import { LocationDetails } from "./location-details";
import { LocationFormDialog } from "./location-form-dialog";
import type { Location } from "@/types/domain";

export function LocationBrowser() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [treeKey, setTreeKey] = useState(0);

  const handleSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const handleAddChild = useCallback((parentId: string | null) => {
    setParentIdForNew(parentId);
    setEditingLocation(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((location: Location) => {
    setEditingLocation(location);
    setParentIdForNew(null);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingLocation(null);
    setParentIdForNew(null);
  }, []);

  const handleSuccess = useCallback(() => {
    handleDialogClose();
    // Refresh the tree
    setTreeKey((k) => k + 1);
  }, [handleDialogClose]);

  const handleDelete = useCallback(() => {
    setSelectedLocation(null);
    setTreeKey((k) => k + 1);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Location Hierarchy</h2>
          <Button size="sm" onClick={() => handleAddChild(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Root Location
          </Button>
        </div>
        <div className="rounded-lg border">
          <LocationTree
            key={treeKey}
            selectedId={selectedLocation?.id}
            onSelect={handleSelect}
            onAddChild={handleAddChild}
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        {selectedLocation ? (
          <LocationDetails
            locationId={selectedLocation.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              Select a location to view details
            </p>
          </div>
        )}
      </div>

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editingLocation}
        parentId={parentIdForNew}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

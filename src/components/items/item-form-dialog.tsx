"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, X, Upload, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createItem, updateItem } from "@/actions/items";
import type { Item, ItemType } from "@/types/domain";

function formatDateForInput(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0] ?? "";
}

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  parentLocationId?: string | null;
  parentItemId?: string | null;
  onSuccess: () => void;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  parentLocationId,
  parentItemId,
  onSuccess,
}: ItemFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<ItemType>(item?.type ?? "object");
  const [photos, setPhotos] = useState<string[]>(() => {
    if (item?.photos) {
      try {
        return JSON.parse(item.photos);
      } catch {
        return item.photos ? [item.photos] : [];
      }
    }
    return [];
  });
  const [showAdvanced, setShowAdvanced] = useState(
    !!(item?.warrantyExpiresAt || item?.maintenanceIntervalDays)
  );

  const isEditing = !!item;
  const title = isEditing ? "Edit Item" : "New Item";
  const description = isEditing
    ? "Update the item details."
    : parentItemId
      ? "Add a new item to this container."
      : "Add a new item to this location.";

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPhotos((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    multiple: true,
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    if (photos.length > 0) {
      formData.set("photos", JSON.stringify(photos));
    }

    if (isEditing) {
      formData.set("id", item.id);
    } else {
      if (parentLocationId) {
        formData.set("parentLocationId", parentLocationId);
      }
      if (parentItemId) {
        formData.set("parentItemId", parentItemId);
      }
    }

    const result = isEditing
      ? await updateItem(formData)
      : await createItem(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={item?.name ?? ""}
                placeholder="e.g., Toolbox, Camera"
                required
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="object">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Object</span>
                      <span className="text-xs text-muted-foreground">
                        An individual item like a tool, book, or gadget
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="container">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Container</span>
                      <span className="text-xs text-muted-foreground">
                        A box, bin, or storage unit that holds other items
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={item?.description ?? ""}
                placeholder="Additional details about this item"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Photos (optional)</Label>

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-md bg-muted"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90 min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                {...getRootProps()}
                className={`
                  flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors
                  ${isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }
                `}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <>
                    <Upload className="h-8 w-8 text-primary" />
                    <p className="text-sm text-primary font-medium">Drop photos here</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Drag and drop photos here, or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    Warranty & Maintenance
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="warrantyExpiresAt">Warranty expires</Label>
                  <Input
                    id="warrantyExpiresAt"
                    name="warrantyExpiresAt"
                    type="date"
                    defaultValue={formatDateForInput(item?.warrantyExpiresAt ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get reminded before your warranty expires
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maintenanceIntervalDays">
                      Maintenance every
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maintenanceIntervalDays"
                        name="maintenanceIntervalDays"
                        type="number"
                        min={1}
                        max={365}
                        defaultValue={item?.maintenanceIntervalDays ?? ""}
                        placeholder="30"
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastMaintenanceAt">Last maintained</Label>
                    <Input
                      id="lastMaintenanceAt"
                      name="lastMaintenanceAt"
                      type="date"
                      defaultValue={formatDateForInput(item?.lastMaintenanceAt ?? null)}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

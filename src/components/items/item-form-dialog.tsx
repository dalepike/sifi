"use client";

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
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
import { createItem, updateItem } from "@/actions/items";
import type { Item, ItemType } from "@/types/domain";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!item;
  const title = isEditing ? "Edit Item" : "New Item";
  const description = isEditing
    ? "Update the item details."
    : parentItemId
      ? "Add a new item to this container."
      : "Add a new item to this location.";

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPhotos((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                  <SelectItem value="object">Object</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {type === "container"
                  ? "Containers can hold other items inside them"
                  : "Objects are individual items that cannot contain others"}
              </p>
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />

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
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {photos.length > 0 ? "Add More Photos" : "Add Photos"}
              </Button>
            </div>
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

"use client";

import { useState } from "react";
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
import { createLocation, updateLocation } from "@/actions/locations";
import type { Location } from "@/types/domain";

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
  parentId?: string | null;
  onSuccess: () => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  parentId,
  onSuccess,
}: LocationFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = !!location;
  const title = isEditing ? "Edit Location" : "New Location";
  const description = isEditing
    ? "Update the location details."
    : parentId
      ? "Add a new child location."
      : "Add a new root location.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    if (isEditing) {
      formData.set("id", location.id);
    } else if (parentId) {
      formData.set("parentId", parentId);
    }

    const result = isEditing
      ? await updateLocation(formData)
      : await createLocation(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                defaultValue={location?.name ?? ""}
                placeholder="e.g., Living Room, Garage"
                required
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Code (2 characters)</Label>
              <Input
                id="code"
                name="code"
                defaultValue={location?.code ?? ""}
                placeholder="e.g., LR, GR"
                maxLength={2}
                pattern="[A-Za-z0-9]{2}"
                required
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                This code appears on QR labels. Items in this location will have
                codes like <code className="rounded bg-muted px-1 font-mono">
                  {parentId ? "XX-" : ""}__-001
                </code> where __ is your code.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={location?.description ?? ""}
                placeholder="Additional details about this location"
                rows={3}
              />
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

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createLocation, updateLocation } from "@/actions/locations";
import type { Location, LocationType } from "@/types/domain";
import { Home, Building2, Car, Warehouse, MoreHorizontal } from "lucide-react";

// Common emojis for location icons
const LOCATION_EMOJIS = [
  // Rooms
  "🛋️", "🛏️", "🍳", "🚿", "🚽", "🧺", "📚", "💻", "🎮", "🏋️",
  // Storage
  "📦", "🗄️", "🧰", "🗃️", "🏠", "🏢", "🚗", "🚙", "🏍️", "🚲",
  // Outdoor
  "🌳", "🌻", "🏡", "🔧", "⚡", "🎄", "🏖️", "⛺", "🏕️", "🌊",
  // Special
  "⭐", "❤️", "💎", "🔑", "📍", "🎯", "✨", "🔥", "💡", "🎁",
];

const LOCATION_TYPE_CONFIG: Record<LocationType, { label: string; icon: typeof Home; defaultEmoji: string }> = {
  home: { label: "Home", icon: Home, defaultEmoji: "🏠" },
  office: { label: "Office", icon: Building2, defaultEmoji: "🏢" },
  vehicle: { label: "Vehicle", icon: Car, defaultEmoji: "🚗" },
  storage: { label: "Storage Unit", icon: Warehouse, defaultEmoji: "📦" },
  other: { label: "Other", icon: MoreHorizontal, defaultEmoji: "📍" },
};

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
  const [selectedIcon, setSelectedIcon] = useState<string | null>(location?.icon ?? null);
  const [selectedType, setSelectedType] = useState<LocationType | null>(location?.locationType ?? null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const isEditing = !!location;
  const isRootLocation = !parentId && !location?.parentId;
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

    // Add icon and locationType
    if (selectedIcon) {
      formData.set("icon", selectedIcon);
    }
    if (selectedType && isRootLocation) {
      formData.set("locationType", selectedType);
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

  function handleTypeChange(type: LocationType) {
    setSelectedType(type);
    // Set default emoji for the type if no custom icon is set
    if (!selectedIcon) {
      setSelectedIcon(LOCATION_TYPE_CONFIG[type].defaultEmoji);
    }
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

            {/* Location Type (only for root locations) */}
            {isRootLocation && (
              <div className="grid gap-2">
                <Label>Location Type</Label>
                <Select
                  value={selectedType ?? undefined}
                  onValueChange={(v) => handleTypeChange(v as LocationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(LOCATION_TYPE_CONFIG) as [LocationType, typeof LOCATION_TYPE_CONFIG.home][]).map(
                      ([type, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={type} value={type}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </span>
                          </SelectItem>
                        );
                      }
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Icon Picker */}
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-2">
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-12 text-2xl"
                    >
                      {selectedIcon || "📍"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="grid grid-cols-10 gap-1">
                      {LOCATION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                          onClick={() => {
                            setSelectedIcon(emoji);
                            setEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    {selectedIcon && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          setSelectedIcon(null);
                          setEmojiPickerOpen(false);
                        }}
                      >
                        Clear icon
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
                <span className="text-sm text-muted-foreground">
                  Click to choose an icon
                </span>
              </div>
            </div>

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

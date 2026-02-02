"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivity, updateActivity } from "@/actions/activities";
import type { Activity } from "@/types/domain";

// Available icons for activities
const ACTIVITY_ICONS = [
  { name: "folder", label: "Folder" },
  { name: "palette", label: "Art" },
  { name: "music", label: "Music" },
  { name: "camera", label: "Photography" },
  { name: "gamepad-2", label: "Gaming" },
  { name: "wrench", label: "Tools" },
  { name: "book", label: "Reading" },
  { name: "dumbbell", label: "Fitness" },
  { name: "tent", label: "Camping" },
  { name: "bike", label: "Cycling" },
  { name: "scissors", label: "Crafts" },
  { name: "utensils", label: "Cooking" },
] as const;

// Get icon component by name
export function getIconComponent(iconName: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "folder": LucideIcons.Folder,
    "palette": LucideIcons.Palette,
    "music": LucideIcons.Music,
    "camera": LucideIcons.Camera,
    "gamepad-2": LucideIcons.Gamepad2,
    "wrench": LucideIcons.Wrench,
    "book": LucideIcons.Book,
    "dumbbell": LucideIcons.Dumbbell,
    "tent": LucideIcons.Tent,
    "bike": LucideIcons.Bike,
    "scissors": LucideIcons.Scissors,
    "utensils": LucideIcons.Utensils,
  };
  return iconMap[iconName] || LucideIcons.Folder;
}

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSuccess: () => void;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  onSuccess,
}: ActivityFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [icon, setIcon] = useState("folder");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!activity;

  // Reset form when dialog opens/closes or activity changes
  useEffect(() => {
    if (open) {
      if (activity) {
        setName(activity.name);
        setDescription(activity.description || "");
        setColor(activity.color || "#6b7280");
        setIcon(activity.icon || "folder");
      } else {
        setName("");
        setDescription("");
        setColor("#6b7280");
        setIcon("folder");
      }
      setError(null);
    }
  }, [open, activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("color", color);
    formData.set("icon", icon);

    if (activity) {
      formData.set("id", activity.id);
    }

    const result = isEditing
      ? await updateActivity(formData)
      : await createActivity(formData);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  };

  const SelectedIcon = getIconComponent(icon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Activity" : "Create Activity"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the activity details below."
                : "Create a new activity to track related items (e.g., Pottery, Sewing, Woodworking)."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pottery, Sewing, Woodworking"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this activity"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Color</Label>
                <ColorPicker value={color} onChange={setColor} />
              </div>

              <div className="grid gap-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <SelectedIcon className="h-4 w-4" />
                        <span>{ACTIVITY_ICONS.find(i => i.name === icon)?.label || "Folder"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_ICONS.map((iconOption) => {
                      const IconComp = getIconComponent(iconOption.name);
                      return (
                        <SelectItem key={iconOption.name} value={iconOption.name}>
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            <span>{iconOption.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

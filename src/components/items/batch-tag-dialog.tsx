"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTags } from "@/actions/tags";
import { batchAddTag } from "@/actions/batch-items";
import type { Tag } from "@/types/domain";

interface BatchTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemIds: string[];
  onSuccess: () => void;
}

export function BatchTagDialog({
  open,
  onOpenChange,
  itemIds,
  onSuccess,
}: BatchTagDialogProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const count = itemIds.length;

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await getTags();
      if (result.success) {
        setTags(result.data);
      }

      setLoading(false);
    }

    load();
    setSelectedTagId(null);
  }, [open]);

  const handleApply = async () => {
    if (!selectedTagId) return;

    setApplying(true);
    setError(null);

    const result = await batchAddTag(itemIds, selectedTagId);

    if (result.success) {
      onSuccess();
      onOpenChange(false);
    } else {
      setError(result.error);
    }

    setApplying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add tag to {count} items</DialogTitle>
          <DialogDescription>
            Select a tag to add to all selected items.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tags available.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create tags first from the Tags page.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] rounded-md border p-2">
            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  className={`flex items-center gap-3 w-full rounded-md px-3 py-2 text-left transition-colors ${
                    selectedTagId === tag.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedTagId(tag.id)}
                >
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium">{tag.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
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
          <Button
            onClick={handleApply}
            disabled={!selectedTagId || applying || tags.length === 0}
          >
            {applying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              `Add tag to ${count} items`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

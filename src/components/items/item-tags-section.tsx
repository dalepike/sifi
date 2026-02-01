"use client";

import { useState, useEffect } from "react";
import { Tags, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getTags } from "@/actions/tags";
import { getItemTags, addTagToItem, removeTagFromItem } from "@/actions/item-tags";
import type { Tag } from "@/types/domain";

interface ItemTagsSectionProps {
  itemId: string;
}

export function ItemTagsSection({ itemId }: ItemTagsSectionProps) {
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Load item's current tags and all available tags
  const loadTags = async () => {
    const [itemTagsResult, allTagsResult] = await Promise.all([
      getItemTags(itemId),
      getTags(),
    ]);

    if (itemTagsResult.success) {
      setItemTags(itemTagsResult.data);
    }
    if (allTagsResult.success) {
      setAllTags(allTagsResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTags();
  }, [itemId]);

  const handleAddTag = async (tagId: string) => {
    const result = await addTagToItem(itemId, tagId);
    if (result.success) {
      await loadTags();
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const result = await removeTagFromItem(itemId, tagId);
    if (result.success) {
      await loadTags();
    }
  };

  // Tags not yet assigned to this item
  const availableTags = allTags.filter(
    (tag) => !itemTags.some((it) => it.id === tag.id)
  );

  const itemTagIds = new Set(itemTags.map((t) => t.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Tags className="h-4 w-4" />
          Tags
          {itemTags.length > 0 && (
            <span className="text-muted-foreground">({itemTags.length})</span>
          )}
        </h3>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2 text-center">
                No tags yet.
                <br />
                <a href="/tags" className="text-primary hover:underline">
                  Create tags first
                </a>
              </p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {allTags.map((tag) => {
                  const isAssigned = itemTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (isAssigned) {
                          handleRemoveTag(tag.id);
                        } else {
                          handleAddTag(tag.id);
                        }
                      }}
                      className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left truncate">{tag.name}</span>
                      {isAssigned && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Display current tags */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      ) : itemTags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags assigned</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {itemTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                title="Remove tag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

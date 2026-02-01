"use client";

import { useEffect, useState } from "react";
import { Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TagCard } from "./tag-card";
import { getTags } from "@/actions/tags";
import type { Tag } from "@/types/domain";

interface TagListProps {
  selectedId?: string;
  onSelect: (tag: Tag) => void;
  onAdd: () => void;
}

export function TagList({ selectedId, onSelect, onAdd }: TagListProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getTags();
      if (result.success) {
        setTags(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <TagIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">No tags yet</p>
        <p className="text-muted-foreground">
          Create tags to organize your items
        </p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tags</h2>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            isSelected={selectedId === tag.id}
            onClick={() => onSelect(tag)}
          />
        ))}
      </div>
    </div>
  );
}

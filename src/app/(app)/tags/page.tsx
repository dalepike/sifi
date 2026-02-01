"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TagCard, TagFormDialog } from "@/components/tags";
import { getTagsWithCounts } from "@/actions/tags";
import { useEffect } from "react";
import type { Tag, TagWithItemCount } from "@/types/domain";

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<TagWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadTags = useCallback(async () => {
    setLoading(true);
    const result = await getTagsWithCounts();
    if (result.success) {
      setTags(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAdd = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    setDialogOpen(false);
    loadTags();
  }, [loadTags]);

  const handleTagClick = useCallback(
    (tag: Tag) => {
      router.push(`/tags/${tag.id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground">
            Organize your items with color-coded tags
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TagIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No tags yet</p>
            <p className="text-muted-foreground">
              Create tags to organize your items
            </p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onClick={() => handleTagClick(tag)}
            />
          ))}
        </div>
      )}

      <TagFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

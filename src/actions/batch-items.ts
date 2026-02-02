"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, itemTags } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Schema for batch operations
const batchIdsSchema = z.array(z.string().uuid()).min(1, "Select at least one item");

export async function batchMoveItems(
  itemIds: string[],
  targetLocationId: string | null,
  targetItemId: string | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = batchIdsSchema.safeParse(itemIds);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    // Update all items to new location/parent
    await db
      .update(items)
      .set({
        parentLocationId: targetLocationId,
        parentItemId: targetItemId,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(items.id, itemIds),
          eq(items.userId, session.user.id)
        )
      );

    revalidatePath("/locations");
    revalidatePath("/items");

    return { success: true as const, count: itemIds.length };
  } catch (error) {
    console.error("Batch move error:", error);
    return { success: false as const, error: "Failed to move items" };
  }
}

export async function batchDeleteItems(itemIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = batchIdsSchema.safeParse(itemIds);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    // Check for containers with children
    const selectedContainers = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          inArray(items.id, itemIds),
          eq(items.userId, session.user.id),
          eq(items.type, "container")
        )
      );

    if (selectedContainers.length > 0) {
      const containerIds = selectedContainers.map((c) => c.id);
      const childItems = await db
        .select({ parentItemId: items.parentItemId })
        .from(items)
        .where(inArray(items.parentItemId, containerIds));

      const nonEmptyContainerIds = new Set(
        childItems.map((c) => c.parentItemId).filter(Boolean)
      );

      if (nonEmptyContainerIds.size > 0) {
        return {
          success: false as const,
          error: `Cannot delete ${nonEmptyContainerIds.size} container(s) that have items inside. Empty them first.`,
        };
      }
    }

    // Delete items
    await db
      .delete(items)
      .where(
        and(
          inArray(items.id, itemIds),
          eq(items.userId, session.user.id)
        )
      );

    revalidatePath("/locations");
    revalidatePath("/items");

    return { success: true as const, count: itemIds.length };
  } catch (error) {
    console.error("Batch delete error:", error);
    return { success: false as const, error: "Failed to delete items" };
  }
}

export async function batchAddTag(itemIds: string[], tagId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = batchIdsSchema.safeParse(itemIds);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    // Insert tag associations, ignoring duplicates
    const values = itemIds.map((itemId) => ({
      itemId,
      tagId,
    }));

    await db
      .insert(itemTags)
      .values(values)
      .onConflictDoNothing();

    revalidatePath("/items");
    revalidatePath("/tags");

    return { success: true as const, count: itemIds.length };
  } catch (error) {
    console.error("Batch add tag error:", error);
    return { success: false as const, error: "Failed to add tag to items" };
  }
}

export async function batchRemoveTag(itemIds: string[], tagId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = batchIdsSchema.safeParse(itemIds);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db
      .delete(itemTags)
      .where(
        and(
          inArray(itemTags.itemId, itemIds),
          eq(itemTags.tagId, tagId)
        )
      );

    revalidatePath("/items");
    revalidatePath("/tags");

    return { success: true as const, count: itemIds.length };
  } catch (error) {
    console.error("Batch remove tag error:", error);
    return { success: false as const, error: "Failed to remove tag from items" };
  }
}

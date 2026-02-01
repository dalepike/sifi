"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addTagToItem as dbAddTagToItem,
  removeTagFromItem as dbRemoveTagFromItem,
  getTagsForItem as dbGetTagsForItem,
} from "@/lib/db/item-tags";
import type { Tag } from "@/types/domain";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function addTagToItem(
  itemId: string,
  tagId: string
): Promise<ActionResult<{ added: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const result = dbAddTagToItem(itemId, tagId, userId);
    if (!result) {
      return { success: false, error: "Item or tag not found" };
    }

    revalidatePath("/tags");
    revalidatePath(`/items/${itemId}`);
    return { success: true, data: { added: true } };
  } catch (error) {
    console.error("Add tag to item error:", error);
    return {
      success: false,
      error: "Failed to add tag to item. Please try again.",
    };
  }
}

export async function removeTagFromItem(
  itemId: string,
  tagId: string
): Promise<ActionResult<{ removed: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const removed = dbRemoveTagFromItem(itemId, tagId, userId);
    if (!removed) {
      return { success: false, error: "Could not remove tag from item" };
    }

    revalidatePath("/tags");
    revalidatePath(`/items/${itemId}`);
    return { success: true, data: { removed: true } };
  } catch (error) {
    console.error("Remove tag from item error:", error);
    return {
      success: false,
      error: "Failed to remove tag from item. Please try again.",
    };
  }
}

export async function getItemTags(
  itemId: string
): Promise<ActionResult<Tag[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const tags = dbGetTagsForItem(itemId, userId);
    return { success: true, data: tags };
  } catch (error) {
    console.error("Get item tags error:", error);
    return {
      success: false,
      error: "Failed to get item tags. Please try again.",
    };
  }
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createTag as dbCreateTag,
  updateTag as dbUpdateTag,
  deleteTag as dbDeleteTag,
  getTagById as dbGetTagById,
  getTagsByUserId,
  getTagWithItemCount as dbGetTagWithItemCount,
  getTagsWithItemCounts,
} from "@/lib/db/tags";
import { getItemsByTagId } from "@/lib/db/item-tags";
import type { Tag, TagWithItemCount, ItemWithLocation } from "@/types/domain";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733)"),
});

const updateTagSchema = z.object({
  id: z.string().uuid("Invalid tag ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createTag(
  formData: FormData
): Promise<ActionResult<Tag>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color"),
  };

  const parsed = tagSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { name, description, color } = parsed.data;

  try {
    const tag = await dbCreateTag({
      userId,
      name,
      description: description || null,
      color,
    });

    revalidatePath("/tags");
    return { success: true, data: tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return {
      success: false,
      error: "Failed to create tag. Please try again.",
    };
  }
}

export async function updateTag(
  formData: FormData
): Promise<ActionResult<Tag>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description"),
    color: formData.get("color") || undefined,
  };

  const parsed = updateTagSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { id, name, description, color } = parsed.data;

  // Verify tag exists and belongs to user
  const existing = await dbGetTagById(id, userId);
  if (!existing) {
    return { success: false, error: "Tag not found" };
  }

  try {
    const tag = await dbUpdateTag(id, userId, {
      name,
      description: description !== undefined ? description || null : undefined,
      color,
    });

    if (!tag) {
      return { success: false, error: "Failed to update tag" };
    }

    revalidatePath("/tags");
    return { success: true, data: tag };
  } catch (error) {
    console.error("Update tag error:", error);
    return {
      success: false,
      error: "Failed to update tag. Please try again.",
    };
  }
}

export async function deleteTag(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify tag exists and belongs to user
  const existing = await dbGetTagById(id, userId);
  if (!existing) {
    return { success: false, error: "Tag not found" };
  }

  try {
    const deleted = await dbDeleteTag(id, userId);
    revalidatePath("/tags");
    return { success: true, data: { deleted } };
  } catch (error) {
    console.error("Delete tag error:", error);
    return {
      success: false,
      error: "Failed to delete tag. Please try again.",
    };
  }
}

export async function getTag(id: string): Promise<ActionResult<Tag>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const tag = await dbGetTagById(id, userId);
  if (!tag) {
    return { success: false, error: "Tag not found" };
  }

  return { success: true, data: tag };
}

export async function getTags(): Promise<ActionResult<Tag[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const tags = await getTagsByUserId(userId);
  return { success: true, data: tags };
}

export async function getTagWithItemCount(
  id: string
): Promise<ActionResult<TagWithItemCount>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const tag = await dbGetTagWithItemCount(id, userId);
  if (!tag) {
    return { success: false, error: "Tag not found" };
  }

  return { success: true, data: tag };
}

export async function getTagsWithCounts(): Promise<ActionResult<TagWithItemCount[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const tags = await getTagsWithItemCounts(userId);
  return { success: true, data: tags };
}

export async function getTagItems(
  tagId: string
): Promise<ActionResult<ItemWithLocation[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify tag exists
  const tag = await dbGetTagById(tagId, userId);
  if (!tag) {
    return { success: false, error: "Tag not found" };
  }

  const items = await getItemsByTagId(tagId, userId);
  return { success: true, data: items };
}

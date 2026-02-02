"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  getItemById as dbGetItemById,
  getItemsByLocationId,
  getItemsByParentItemId,
  getItemWithLocation,
  getItemChildCount,
  moveItem as dbMoveItem,
  searchItems as dbSearchItems,
  getContainers as dbGetContainers,
} from "@/lib/db/items";
import { getLocationById } from "@/lib/db/locations";
import type { Item, ItemWithLocation } from "@/types/domain";

const createItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  type: z.enum(["container", "object"]),
  parentLocationId: z.string().uuid().nullable().optional(),
  parentItemId: z.string().uuid().nullable().optional(),
  photos: z.string().optional(),
  warrantyExpiresAt: z.string().optional().transform((val) => val || null),
  maintenanceIntervalDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  lastMaintenanceAt: z.string().optional().transform((val) => val || null),
});

const updateItemSchema = z.object({
  id: z.string().uuid("Invalid item ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
  type: z.enum(["container", "object"]).optional(),
  photos: z.string().optional(),
  warrantyExpiresAt: z.string().optional().transform((val) => val || null),
  maintenanceIntervalDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  lastMaintenanceAt: z.string().optional().transform((val) => val || null),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createItem(
  formData: FormData
): Promise<ActionResult<Item>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    parentLocationId: formData.get("parentLocationId") || null,
    parentItemId: formData.get("parentItemId") || null,
    photos: formData.get("photos") || undefined,
    warrantyExpiresAt: formData.get("warrantyExpiresAt") || undefined,
    maintenanceIntervalDays: formData.get("maintenanceIntervalDays") || undefined,
    lastMaintenanceAt: formData.get("lastMaintenanceAt") || undefined,
  };

  const parsed = createItemSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { id, name, description, type, parentLocationId, parentItemId, photos, warrantyExpiresAt, maintenanceIntervalDays, lastMaintenanceAt } =
    parsed.data;

  // Validate exactly one parent
  const hasLocationParent = !!parentLocationId;
  const hasItemParent = !!parentItemId;

  if (hasLocationParent === hasItemParent) {
    return {
      success: false,
      error: "Item must have exactly one parent (location or container)",
    };
  }

  // Validate parent exists and belongs to user
  if (parentLocationId) {
    const location = await getLocationById(parentLocationId, userId);
    if (!location) {
      return { success: false, error: "Parent location not found" };
    }
  }

  if (parentItemId) {
    const parentItem = await dbGetItemById(parentItemId, userId);
    if (!parentItem) {
      return { success: false, error: "Parent container not found" };
    }
    if (parentItem.type !== "container") {
      return { success: false, error: "Items can only be placed in containers" };
    }
  }

  try {
    const item = await dbCreateItem({
      id,
      userId,
      name,
      description: description || null,
      type,
      parentLocationId: parentLocationId || null,
      parentItemId: parentItemId || null,
      photos: photos || null,
      warrantyExpiresAt: warrantyExpiresAt || null,
      maintenanceIntervalDays: maintenanceIntervalDays ?? null,
      lastMaintenanceAt: lastMaintenanceAt || null,
    });

    revalidatePath("/locations");
    return { success: true, data: item };
  } catch (error) {
    console.error("Create item error:", error);
    return {
      success: false,
      error: "Failed to create item. Please try again.",
    };
  }
}

export async function updateItem(
  formData: FormData
): Promise<ActionResult<Item>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description"),
    type: formData.get("type") || undefined,
    photos: formData.get("photos"),
    warrantyExpiresAt: formData.get("warrantyExpiresAt") || undefined,
    maintenanceIntervalDays: formData.get("maintenanceIntervalDays") || undefined,
    lastMaintenanceAt: formData.get("lastMaintenanceAt") || undefined,
  };

  const parsed = updateItemSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { id, name, description, type, photos, warrantyExpiresAt, maintenanceIntervalDays, lastMaintenanceAt } = parsed.data;

  // Verify item exists and belongs to user
  const existing = await dbGetItemById(id, userId);
  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  // If changing type from container to object, check for children
  if (type === "object" && existing.type === "container") {
    const childCount = await getItemChildCount(id, userId);
    if (childCount > 0) {
      return {
        success: false,
        error: "Cannot change container to object: it contains items",
      };
    }
  }

  try {
    const item = await dbUpdateItem(id, userId, {
      name,
      description: description !== undefined ? description || null : undefined,
      type,
      photos: photos !== undefined ? photos || null : undefined,
      warrantyExpiresAt: warrantyExpiresAt !== undefined ? warrantyExpiresAt : undefined,
      maintenanceIntervalDays: maintenanceIntervalDays !== undefined ? maintenanceIntervalDays : undefined,
      lastMaintenanceAt: lastMaintenanceAt !== undefined ? lastMaintenanceAt : undefined,
    });

    if (!item) {
      return { success: false, error: "Failed to update item" };
    }

    revalidatePath("/locations");
    return { success: true, data: item };
  } catch (error) {
    console.error("Update item error:", error);
    return {
      success: false,
      error: "Failed to update item. Please try again.",
    };
  }
}

export async function deleteItem(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify item exists and belongs to user
  const existing = await dbGetItemById(id, userId);
  if (!existing) {
    return { success: false, error: "Item not found" };
  }

  try {
    const deleted = await dbDeleteItem(id, userId);
    revalidatePath("/locations");
    return { success: true, data: { deleted } };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Failed to delete item. Please try again.",
    };
  }
}

export async function getItem(
  id: string
): Promise<ActionResult<ItemWithLocation>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const item = await getItemWithLocation(id, userId);
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: item };
}

export async function getItemsInLocation(
  locationId: string
): Promise<ActionResult<Item[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const items = await getItemsByLocationId(locationId, userId);
  return { success: true, data: items };
}

export async function getItemsInContainer(
  containerId: string
): Promise<ActionResult<Item[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const items = await getItemsByParentItemId(containerId, userId);
  return { success: true, data: items };
}

export async function moveItem(
  id: string,
  target: { locationId: string } | { itemId: string }
): Promise<ActionResult<Item>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const item = await dbMoveItem(id, userId, target);
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    revalidatePath("/locations");
    return { success: true, data: item };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Failed to move item. Please try again.",
    };
  }
}

export async function searchItems(
  query: string
): Promise<ActionResult<ItemWithLocation[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  const items = await dbSearchItems(query, userId);
  return { success: true, data: items };
}

export async function getContainers(): Promise<ActionResult<ItemWithLocation[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const containers = await dbGetContainers(userId);
  return { success: true, data: containers };
}

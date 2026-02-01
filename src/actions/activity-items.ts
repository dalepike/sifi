"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addItemToActivity as dbAddItemToActivity,
  removeItemFromActivity as dbRemoveItemFromActivity,
  getItemsForActivity as dbGetItemsForActivity,
  getActivitiesForItem as dbGetActivitiesForItem,
} from "@/lib/db/activity-items";
import type { ItemWithLocation } from "@/types/domain";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function addItemToActivity(
  activityId: string,
  itemId: string
): Promise<ActionResult<{ added: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const result = dbAddItemToActivity(activityId, itemId, userId);
    if (!result) {
      return { success: false, error: "Activity or item not found" };
    }

    revalidatePath("/activities");
    revalidatePath(`/items/${itemId}`);
    return { success: true, data: { added: true } };
  } catch (error) {
    console.error("Add item to activity error:", error);
    return {
      success: false,
      error: "Failed to add item to activity. Please try again.",
    };
  }
}

export async function removeItemFromActivity(
  activityId: string,
  itemId: string
): Promise<ActionResult<{ removed: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const removed = dbRemoveItemFromActivity(activityId, itemId, userId);
    if (!removed) {
      return { success: false, error: "Could not remove item from activity" };
    }

    revalidatePath("/activities");
    revalidatePath(`/items/${itemId}`);
    return { success: true, data: { removed: true } };
  } catch (error) {
    console.error("Remove item from activity error:", error);
    return {
      success: false,
      error: "Failed to remove item from activity. Please try again.",
    };
  }
}

export async function getActivityItems(
  activityId: string
): Promise<ActionResult<ItemWithLocation[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const items = dbGetItemsForActivity(activityId, userId);
    return { success: true, data: items };
  } catch (error) {
    console.error("Get activity items error:", error);
    return {
      success: false,
      error: "Failed to get activity items. Please try again.",
    };
  }
}

export async function getItemActivities(
  itemId: string
): Promise<ActionResult<{ id: string; name: string }[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const activities = dbGetActivitiesForItem(itemId, userId);
    return { success: true, data: activities };
  } catch (error) {
    console.error("Get item activities error:", error);
    return {
      success: false,
      error: "Failed to get item activities. Please try again.",
    };
  }
}

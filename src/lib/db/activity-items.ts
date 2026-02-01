import { eq, and, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { activityItems, activities, items } from "./schema";
import { getItemWithLocation } from "./items";
import type { ActivityItem, ItemWithLocation } from "@/types/domain";

export async function addItemToActivity(
  activityId: string,
  itemId: string,
  userId: string
): Promise<ActivityItem | undefined> {
  // Verify activity belongs to user
  const [activity] = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);

  if (!activity) return undefined;

  // Verify item belongs to user
  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);

  if (!item) return undefined;

  // Check if already exists
  const [existing] = await db
    .select()
    .from(activityItems)
    .where(
      and(
        eq(activityItems.activityId, activityId),
        eq(activityItems.itemId, itemId)
      )
    )
    .limit(1);

  if (existing) {
    return {
      activityId: existing.activityId,
      itemId: existing.itemId,
      createdAt: formatDateRequired(existing.createdAt),
    };
  }

  // Insert new relationship
  const [row] = await db
    .insert(activityItems)
    .values({ activityId, itemId })
    .returning();

  if (!row) {
    throw new Error("Failed to add item to activity");
  }

  return {
    activityId: row.activityId,
    itemId: row.itemId,
    createdAt: formatDateRequired(row.createdAt),
  };
}

export async function removeItemFromActivity(
  activityId: string,
  itemId: string,
  userId: string
): Promise<boolean> {
  // Verify activity belongs to user
  const [activity] = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);

  if (!activity) return false;

  const result = await db
    .delete(activityItems)
    .where(
      and(
        eq(activityItems.activityId, activityId),
        eq(activityItems.itemId, itemId)
      )
    )
    .returning();

  return result.length > 0;
}

export async function getItemsForActivity(
  activityId: string,
  userId: string
): Promise<ItemWithLocation[]> {
  // Get item IDs for the activity
  const result = await db.execute(sql`
    SELECT ai.item_id
    FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.activity_id = ${activityId} AND a.user_id = ${userId}
    ORDER BY ai.created_at DESC
  `);

  const rows = result.rows as { item_id: string }[];

  // Get full item details for each
  const itemsList: ItemWithLocation[] = [];
  for (const row of rows) {
    const item = await getItemWithLocation(row.item_id, userId);
    if (item) {
      itemsList.push(item);
    }
  }

  return itemsList;
}

export async function getActivitiesForItem(
  itemId: string,
  userId: string
): Promise<{ id: string; name: string }[]> {
  const result = await db.execute(sql`
    SELECT a.id, a.name
    FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.item_id = ${itemId} AND a.user_id = ${userId} AND a.status = 'active'
    ORDER BY a.name
  `);

  return (result.rows as { id: string; name: string }[]).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export async function isItemInActivity(
  activityId: string,
  itemId: string,
  userId: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.activity_id = ${activityId} AND ai.item_id = ${itemId} AND a.user_id = ${userId}
  `);

  return result.rows.length > 0;
}

import { getDb, toCamelCase } from "./client";
import type { ActivityItem, ItemWithLocation } from "@/types/domain";
import { getItemWithLocation } from "./items";

/**
 * Activity-Item relationship database operations
 */

export function addItemToActivity(
  activityId: string,
  itemId: string,
  userId: string
): ActivityItem | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  // Verify activity belongs to user
  const activityCheck = db.prepare(`
    SELECT id FROM activities WHERE id = ? AND user_id = ?
  `);
  const activity = activityCheck.get(activityId, userId);
  if (!activity) return undefined;

  // Verify item belongs to user
  const itemCheck = db.prepare(`
    SELECT id FROM items WHERE id = ? AND user_id = ?
  `);
  const item = itemCheck.get(itemId, userId);
  if (!item) return undefined;

  // Check if already exists
  const existingStmt = db.prepare(`
    SELECT * FROM activity_items WHERE activity_id = ? AND item_id = ?
  `);
  const existing = existingStmt.get(activityId, itemId);
  if (existing) {
    return toCamelCase<ActivityItem>(existing as Record<string, unknown>);
  }

  // Insert new relationship
  const stmt = db.prepare(`
    INSERT INTO activity_items (activity_id, item_id, created_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(activityId, itemId, now);

  return {
    activityId,
    itemId,
    createdAt: now,
  };
}

export function removeItemFromActivity(
  activityId: string,
  itemId: string,
  userId: string
): boolean {
  const db = getDb();

  // Verify activity belongs to user
  const activityCheck = db.prepare(`
    SELECT id FROM activities WHERE id = ? AND user_id = ?
  `);
  const activity = activityCheck.get(activityId, userId);
  if (!activity) return false;

  const stmt = db.prepare(`
    DELETE FROM activity_items WHERE activity_id = ? AND item_id = ?
  `);
  const result = stmt.run(activityId, itemId);
  return result.changes > 0;
}

export function getItemsForActivity(
  activityId: string,
  userId: string
): ItemWithLocation[] {
  const db = getDb();

  // Get item IDs for the activity
  const stmt = db.prepare(`
    SELECT ai.item_id
    FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.activity_id = ? AND a.user_id = ?
    ORDER BY ai.created_at DESC
  `);

  const rows = stmt.all(activityId, userId) as { item_id: string }[];

  // Get full item details for each
  const items: ItemWithLocation[] = [];
  for (const row of rows) {
    const item = getItemWithLocation(row.item_id, userId);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

export function getActivitiesForItem(
  itemId: string,
  userId: string
): { id: string; name: string }[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT a.id, a.name
    FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.item_id = ? AND a.user_id = ? AND a.status = 'active'
    ORDER BY a.name
  `);

  const rows = stmt.all(itemId, userId) as {
    id: string;
    name: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export function isItemInActivity(
  activityId: string,
  itemId: string,
  userId: string
): boolean {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT 1 FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.activity_id = ? AND ai.item_id = ? AND a.user_id = ?
  `);

  const result = stmt.get(activityId, itemId, userId);
  return !!result;
}

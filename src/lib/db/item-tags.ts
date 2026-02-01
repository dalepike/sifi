import { getDb, toCamelCase } from "./client";
import type { ItemTag, Tag, ItemWithLocation } from "@/types/domain";
import { getItemWithLocation } from "./items";

/**
 * Item-Tag relationship database operations
 */

export function addTagToItem(
  itemId: string,
  tagId: string,
  userId: string
): ItemTag | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  // Verify item belongs to user
  const itemCheck = db.prepare(`
    SELECT id FROM items WHERE id = ? AND user_id = ?
  `);
  const item = itemCheck.get(itemId, userId);
  if (!item) return undefined;

  // Verify tag belongs to user
  const tagCheck = db.prepare(`
    SELECT id FROM categories WHERE id = ? AND user_id = ?
  `);
  const tag = tagCheck.get(tagId, userId);
  if (!tag) return undefined;

  // Check if already exists
  const existingStmt = db.prepare(`
    SELECT * FROM item_tags WHERE item_id = ? AND tag_id = ?
  `);
  const existing = existingStmt.get(itemId, tagId);
  if (existing) {
    return toCamelCase<ItemTag>(existing as Record<string, unknown>);
  }

  // Insert new relationship
  const stmt = db.prepare(`
    INSERT INTO item_tags (item_id, tag_id, created_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(itemId, tagId, now);

  return {
    itemId,
    tagId,
    createdAt: now,
  };
}

export function removeTagFromItem(
  itemId: string,
  tagId: string,
  userId: string
): boolean {
  const db = getDb();

  // Verify item belongs to user
  const itemCheck = db.prepare(`
    SELECT id FROM items WHERE id = ? AND user_id = ?
  `);
  const item = itemCheck.get(itemId, userId);
  if (!item) return false;

  const stmt = db.prepare(`
    DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?
  `);
  const result = stmt.run(itemId, tagId);
  return result.changes > 0;
}

export function getTagsForItem(
  itemId: string,
  userId: string
): Tag[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT c.*
    FROM item_tags it
    JOIN categories c ON it.tag_id = c.id
    JOIN items i ON it.item_id = i.id
    WHERE it.item_id = ? AND i.user_id = ?
    ORDER BY c.name
  `);

  const rows = stmt.all(itemId, userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Tag>(row));
}

export function getItemsByTagId(
  tagId: string,
  userId: string
): ItemWithLocation[] {
  const db = getDb();

  // Get item IDs for the tag
  const stmt = db.prepare(`
    SELECT it.item_id
    FROM item_tags it
    JOIN categories c ON it.tag_id = c.id
    WHERE it.tag_id = ? AND c.user_id = ?
    ORDER BY it.created_at DESC
  `);

  const rows = stmt.all(tagId, userId) as { item_id: string }[];

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

export function isItemTagged(
  itemId: string,
  tagId: string,
  userId: string
): boolean {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT 1 FROM item_tags it
    JOIN items i ON it.item_id = i.id
    WHERE it.item_id = ? AND it.tag_id = ? AND i.user_id = ?
  `);

  const result = stmt.get(itemId, tagId, userId);
  return !!result;
}

import { eq, and, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { itemTags, items, tags } from "./schema";
import { getItemWithLocation } from "./items";
import type { ItemTag, Tag, ItemWithLocation } from "@/types/domain";

export async function addTagToItem(
  itemId: string,
  tagId: string,
  userId: string
): Promise<ItemTag | undefined> {
  // Verify item belongs to user
  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);

  if (!item) return undefined;

  // Verify tag belongs to user
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) return undefined;

  // Check if already exists
  const [existing] = await db
    .select()
    .from(itemTags)
    .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)))
    .limit(1);

  if (existing) {
    return {
      itemId: existing.itemId,
      tagId: existing.tagId,
      createdAt: formatDateRequired(existing.createdAt),
    };
  }

  // Insert new relationship
  const [row] = await db
    .insert(itemTags)
    .values({ itemId, tagId })
    .returning();

  if (!row) {
    throw new Error("Failed to add tag to item");
  }

  return {
    itemId: row.itemId,
    tagId: row.tagId,
    createdAt: formatDateRequired(row.createdAt),
  };
}

export async function removeTagFromItem(
  itemId: string,
  tagId: string,
  userId: string
): Promise<boolean> {
  // Verify item belongs to user
  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);

  if (!item) return false;

  const result = await db
    .delete(itemTags)
    .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)))
    .returning();

  return result.length > 0;
}

export async function getTagsForItem(
  itemId: string,
  userId: string
): Promise<Tag[]> {
  const result = await db.execute(sql`
    SELECT c.*
    FROM item_tags it
    JOIN categories c ON it.tag_id = c.id
    JOIN items i ON it.item_id = i.id
    WHERE it.item_id = ${itemId} AND i.user_id = ${userId}
    ORDER BY c.name
  `);

  return (result.rows as any[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    color: row.color,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  }));
}

export async function getItemsByTagId(
  tagId: string,
  userId: string
): Promise<ItemWithLocation[]> {
  // Get item IDs for the tag
  const result = await db.execute(sql`
    SELECT it.item_id
    FROM item_tags it
    JOIN categories c ON it.tag_id = c.id
    WHERE it.tag_id = ${tagId} AND c.user_id = ${userId}
    ORDER BY it.created_at DESC
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

export async function isItemTagged(
  itemId: string,
  tagId: string,
  userId: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM item_tags it
    JOIN items i ON it.item_id = i.id
    WHERE it.item_id = ${itemId} AND it.tag_id = ${tagId} AND i.user_id = ${userId}
  `);

  return result.rows.length > 0;
}

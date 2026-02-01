import { v4 as uuid } from "uuid";
import { getDb, toCamelCase } from "./client";
import type { Tag, NewTag, TagWithItemCount } from "@/types/domain";

/**
 * Tag database operations
 * Note: Tags are stored in the 'categories' table (kept for migration simplicity)
 */

export function createTag(data: NewTag): Tag {
  const db = getDb();
  const id = data.id || uuid();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO categories (id, user_id, name, description, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId,
    data.name,
    data.description || null,
    data.color,
    now
  );

  return getTagById(id, data.userId)!;
}

export function getTagById(id: string, userId: string): Tag | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM categories WHERE id = ? AND user_id = ?
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Tag>(row) : undefined;
}

export function getTagsByUserId(userId: string): Tag[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM categories WHERE user_id = ? ORDER BY name
  `);

  const rows = stmt.all(userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Tag>(row));
}

export function getTagWithItemCount(
  id: string,
  userId: string
): TagWithItemCount | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      c.*,
      COUNT(it.item_id) as item_count
    FROM categories c
    LEFT JOIN item_tags it ON c.id = it.tag_id
    WHERE c.id = ? AND c.user_id = ?
    GROUP BY c.id
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  if (!row) return undefined;

  const tag = toCamelCase<Tag>({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    color: row.color,
    created_at: row.created_at,
  });

  return {
    ...tag,
    itemCount: row.item_count as number,
  };
}

export function getTagsWithItemCounts(userId: string): TagWithItemCount[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      c.*,
      COUNT(it.item_id) as item_count
    FROM categories c
    LEFT JOIN item_tags it ON c.id = it.tag_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.name
  `);

  const rows = stmt.all(userId) as Record<string, unknown>[];

  return rows.map((row) => {
    const tag = toCamelCase<Tag>({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      color: row.color,
      created_at: row.created_at,
    });

    return {
      ...tag,
      itemCount: row.item_count as number,
    };
  });
}

export function updateTag(
  id: string,
  userId: string,
  data: Partial<NewTag>
): Tag | undefined {
  const db = getDb();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.color !== undefined) {
    updates.push("color = ?");
    values.push(data.color);
  }

  if (updates.length === 0) {
    return getTagById(id, userId);
  }

  values.push(id);
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE categories SET ${updates.join(", ")} WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  return getTagById(id, userId);
}

export function deleteTag(id: string, userId: string): boolean {
  const db = getDb();

  // Item-tag relationships will be cascade deleted
  const stmt = db.prepare(`
    DELETE FROM categories WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function getTagItemCount(id: string, userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM item_tags it
    JOIN categories c ON it.tag_id = c.id
    WHERE it.tag_id = ? AND c.user_id = ?
  `);
  const result = stmt.get(id, userId) as { count: number };
  return result.count;
}

import { eq, and, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { tags, itemTags } from "./schema";
import type { Tag, NewTag, TagWithItemCount } from "@/types/domain";

// Convert Drizzle tag to domain Tag type
function toDomainTag(row: typeof tags.$inferSelect): Tag {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    color: row.color,
    createdAt: formatDateRequired(row.createdAt),
  };
}

export async function createTag(data: NewTag): Promise<Tag> {
  const [row] = await db
    .insert(tags)
    .values({
      id: data.id,
      userId: data.userId,
      name: data.name,
      description: data.description ?? null,
      color: data.color,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create tag");
  }

  return toDomainTag(row);
}

export async function getTagById(
  id: string,
  userId: string
): Promise<Tag | undefined> {
  const [row] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .limit(1);

  return row ? toDomainTag(row) : undefined;
}

export async function getTagsByUserId(userId: string): Promise<Tag[]> {
  const rows = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);

  return rows.map(toDomainTag);
}

export async function getTagWithItemCount(
  id: string,
  userId: string
): Promise<TagWithItemCount | undefined> {
  const result = await db.execute(sql`
    SELECT
      c.*,
      COUNT(it.item_id) as item_count
    FROM categories c
    LEFT JOIN item_tags it ON c.id = it.tag_id
    WHERE c.id = ${id} AND c.user_id = ${userId}
    GROUP BY c.id
  `);

  const row = result.rows[0] as any;
  if (!row) return undefined;

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    color: row.color,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    itemCount: Number(row.item_count),
  };
}

export async function getTagsWithItemCounts(
  userId: string
): Promise<TagWithItemCount[]> {
  const result = await db.execute(sql`
    SELECT
      c.*,
      COUNT(it.item_id) as item_count
    FROM categories c
    LEFT JOIN item_tags it ON c.id = it.tag_id
    WHERE c.user_id = ${userId}
    GROUP BY c.id
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
    itemCount: Number(row.item_count),
  }));
}

export async function updateTag(
  id: string,
  userId: string,
  data: Partial<NewTag>
): Promise<Tag | undefined> {
  const updateData: Partial<typeof tags.$inferInsert> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.color !== undefined) {
    updateData.color = data.color;
  }

  if (Object.keys(updateData).length === 0) {
    return getTagById(id, userId);
  }

  const [row] = await db
    .update(tags)
    .set(updateData)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();

  return row ? toDomainTag(row) : undefined;
}

export async function deleteTag(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();

  return result.length > 0;
}

export async function getTagItemCount(
  id: string,
  userId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(and(eq(itemTags.tagId, id), eq(tags.userId, userId)));

  return Number(result?.count ?? 0);
}

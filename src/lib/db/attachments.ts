import { eq, and, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { itemAttachments, items } from "./schema";
import type { Attachment, NewAttachment, AttachmentMeta } from "@/types/domain";
import { randomUUID } from "crypto";

// Convert Drizzle attachment to domain Attachment type
function toDomainAttachment(row: typeof itemAttachments.$inferSelect): Attachment {
  return {
    id: row.id,
    itemId: row.itemId,
    userId: row.userId,
    title: row.title,
    filename: row.filename,
    mimeType: row.mimeType,
    data: row.data,
    sizeBytes: row.sizeBytes,
    sortOrder: row.sortOrder ?? 0,
    createdAt: formatDateRequired(row.createdAt),
    updatedAt: formatDateRequired(row.updatedAt),
  };
}

export async function createAttachment(
  data: NewAttachment
): Promise<Attachment> {
  const id = randomUUID();

  // Get the next sort_order for this item
  const [maxOrderResult] = await db
    .select({
      nextOrder: sql<number>`COALESCE(MAX(${itemAttachments.sortOrder}), -1) + 1`,
    })
    .from(itemAttachments)
    .where(eq(itemAttachments.itemId, data.itemId));

  const nextOrder = Number(maxOrderResult?.nextOrder ?? 0);

  const [row] = await db
    .insert(itemAttachments)
    .values({
      id,
      itemId: data.itemId,
      userId: data.userId,
      title: data.title,
      filename: data.filename,
      mimeType: data.mimeType,
      data: data.data,
      sizeBytes: data.sizeBytes,
      sortOrder: nextOrder,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create attachment");
  }

  return toDomainAttachment(row);
}

export async function getAttachmentById(
  id: string,
  userId: string
): Promise<Attachment | undefined> {
  const result = await db.execute(sql`
    SELECT a.* FROM item_attachments a
    JOIN items i ON a.item_id = i.id
    WHERE a.id = ${id} AND i.user_id = ${userId}
  `);

  const row = result.rows[0] as any;
  if (!row) return undefined;

  return {
    id: row.id,
    itemId: row.item_id,
    userId: row.user_id,
    title: row.title,
    filename: row.filename,
    mimeType: row.mime_type,
    data: row.data,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order ?? 0,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

export async function getAttachmentsForItem(
  itemId: string,
  userId: string
): Promise<AttachmentMeta[]> {
  // Return metadata only (without data field) for list display
  const result = await db.execute(sql`
    SELECT a.id, a.item_id, a.title, a.filename, a.mime_type, a.size_bytes, a.sort_order, a.created_at
    FROM item_attachments a
    JOIN items i ON a.item_id = i.id
    WHERE a.item_id = ${itemId} AND i.user_id = ${userId}
    ORDER BY a.sort_order ASC
  `);

  return (result.rows as any[]).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order ?? 0,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  }));
}

export async function updateAttachment(
  id: string,
  userId: string,
  data: { title?: string }
): Promise<Attachment | undefined> {
  // Verify ownership through item
  const existing = await getAttachmentById(id, userId);
  if (!existing) return undefined;

  if (data.title !== undefined) {
    await db
      .update(itemAttachments)
      .set({ title: data.title, updatedAt: new Date() })
      .where(eq(itemAttachments.id, id));
  }

  return getAttachmentById(id, userId);
}

export async function deleteAttachment(
  id: string,
  userId: string
): Promise<boolean> {
  // Verify ownership through item
  const existing = await getAttachmentById(id, userId);
  if (!existing) return false;

  const result = await db
    .delete(itemAttachments)
    .where(eq(itemAttachments.id, id))
    .returning();

  return result.length > 0;
}

export async function reorderAttachments(
  itemId: string,
  userId: string,
  orderedIds: string[]
): Promise<boolean> {
  // Verify item ownership
  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);

  if (!item) return false;

  // Update sort_order for each attachment
  for (let index = 0; index < orderedIds.length; index++) {
    const attachmentId = orderedIds[index];
    if (attachmentId) {
      await db
        .update(itemAttachments)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(
          and(
            eq(itemAttachments.id, attachmentId),
            eq(itemAttachments.itemId, itemId)
          )
        );
    }
  }

  return true;
}

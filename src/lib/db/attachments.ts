import { getDb, toCamelCase } from "./client";
import type { Attachment, NewAttachment, AttachmentMeta } from "@/types/domain";
import { randomUUID } from "crypto";

/**
 * Item attachment database operations
 */

export function createAttachment(data: NewAttachment): Attachment {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  // Get the next sort_order for this item
  const maxOrderStmt = db.prepare(`
    SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
    FROM item_attachments WHERE item_id = ?
  `);
  const { next_order } = maxOrderStmt.get(data.itemId) as { next_order: number };

  const stmt = db.prepare(`
    INSERT INTO item_attachments (
      id, item_id, user_id, title, filename, mime_type, data, size_bytes, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.itemId,
    data.userId,
    data.title,
    data.filename,
    data.mimeType,
    data.data,
    data.sizeBytes,
    next_order,
    now,
    now
  );

  return {
    id,
    itemId: data.itemId,
    userId: data.userId,
    title: data.title,
    filename: data.filename,
    mimeType: data.mimeType,
    data: data.data,
    sizeBytes: data.sizeBytes,
    sortOrder: next_order,
    createdAt: now,
    updatedAt: now,
  };
}

export function getAttachmentById(
  id: string,
  userId: string
): Attachment | undefined {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT a.* FROM item_attachments a
    JOIN items i ON a.item_id = i.id
    WHERE a.id = ? AND i.user_id = ?
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  if (!row) return undefined;

  return toCamelCase<Attachment>(row);
}

export function getAttachmentsForItem(
  itemId: string,
  userId: string
): AttachmentMeta[] {
  const db = getDb();

  // Return metadata only (without data field) for list display
  const stmt = db.prepare(`
    SELECT a.id, a.item_id, a.title, a.filename, a.mime_type, a.size_bytes, a.sort_order, a.created_at
    FROM item_attachments a
    JOIN items i ON a.item_id = i.id
    WHERE a.item_id = ? AND i.user_id = ?
    ORDER BY a.sort_order ASC
  `);

  const rows = stmt.all(itemId, userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<AttachmentMeta>(row));
}

export function updateAttachment(
  id: string,
  userId: string,
  data: { title?: string }
): Attachment | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  // Verify ownership through item
  const existing = getAttachmentById(id, userId);
  if (!existing) return undefined;

  if (data.title !== undefined) {
    const stmt = db.prepare(`
      UPDATE item_attachments SET title = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(data.title, now, id);
  }

  return getAttachmentById(id, userId);
}

export function deleteAttachment(id: string, userId: string): boolean {
  const db = getDb();

  // Verify ownership through item
  const existing = getAttachmentById(id, userId);
  if (!existing) return false;

  const stmt = db.prepare(`DELETE FROM item_attachments WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function reorderAttachments(
  itemId: string,
  userId: string,
  orderedIds: string[]
): boolean {
  const db = getDb();

  // Verify item ownership
  const itemCheck = db.prepare(`SELECT id FROM items WHERE id = ? AND user_id = ?`);
  const item = itemCheck.get(itemId, userId);
  if (!item) return false;

  const now = new Date().toISOString();

  // Update sort_order for each attachment
  const updateStmt = db.prepare(`
    UPDATE item_attachments
    SET sort_order = ?, updated_at = ?
    WHERE id = ? AND item_id = ?
  `);

  const transaction = db.transaction(() => {
    orderedIds.forEach((attachmentId, index) => {
      updateStmt.run(index, now, attachmentId, itemId);
    });
  });

  transaction();
  return true;
}

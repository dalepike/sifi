"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createAttachment as dbCreateAttachment,
  getAttachmentById as dbGetAttachmentById,
  getAttachmentsForItem as dbGetAttachmentsForItem,
  updateAttachment as dbUpdateAttachment,
  deleteAttachment as dbDeleteAttachment,
  reorderAttachments as dbReorderAttachments,
} from "@/lib/db/attachments";
import type { Attachment, AttachmentMeta } from "@/types/domain";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB hard limit

// Validation schemas
const createAttachmentSchema = z.object({
  itemId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  data: z.string(), // Base64
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, "File size exceeds 10MB limit"),
});

const updateAttachmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
});

const reorderAttachmentsSchema = z.object({
  itemId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()),
});

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createAttachment(
  data: z.infer<typeof createAttachmentSchema>
): Promise<ActionResult<Attachment>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = createAttachmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const attachment = dbCreateAttachment({
      ...parsed.data,
      userId,
    });

    revalidatePath(`/items/${parsed.data.itemId}`);
    return { success: true, data: attachment };
  } catch (error) {
    console.error("Create attachment error:", error);
    return {
      success: false,
      error: "Failed to create attachment. Please try again.",
    };
  }
}

export async function getAttachmentsForItem(
  itemId: string
): Promise<ActionResult<AttachmentMeta[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const attachments = dbGetAttachmentsForItem(itemId, userId);
    return { success: true, data: attachments };
  } catch (error) {
    console.error("Get attachments error:", error);
    return {
      success: false,
      error: "Failed to get attachments. Please try again.",
    };
  }
}

export async function getAttachmentData(
  id: string
): Promise<ActionResult<Attachment>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const attachment = dbGetAttachmentById(id, userId);
    if (!attachment) {
      return { success: false, error: "Attachment not found" };
    }
    return { success: true, data: attachment };
  } catch (error) {
    console.error("Get attachment data error:", error);
    return {
      success: false,
      error: "Failed to get attachment. Please try again.",
    };
  }
}

export async function updateAttachment(
  data: z.infer<typeof updateAttachmentSchema>
): Promise<ActionResult<Attachment>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = updateAttachmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const attachment = dbUpdateAttachment(parsed.data.id, userId, {
      title: parsed.data.title,
    });

    if (!attachment) {
      return { success: false, error: "Attachment not found" };
    }

    revalidatePath(`/items/${attachment.itemId}`);
    return { success: true, data: attachment };
  } catch (error) {
    console.error("Update attachment error:", error);
    return {
      success: false,
      error: "Failed to update attachment. Please try again.",
    };
  }
}

export async function deleteAttachment(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Get the attachment first to know the item ID for revalidation
    const attachment = dbGetAttachmentById(id, userId);
    if (!attachment) {
      return { success: false, error: "Attachment not found" };
    }

    const deleted = dbDeleteAttachment(id, userId);
    if (!deleted) {
      return { success: false, error: "Could not delete attachment" };
    }

    revalidatePath(`/items/${attachment.itemId}`);
    return { success: true, data: { deleted: true } };
  } catch (error) {
    console.error("Delete attachment error:", error);
    return {
      success: false,
      error: "Failed to delete attachment. Please try again.",
    };
  }
}

export async function reorderAttachments(
  data: z.infer<typeof reorderAttachmentsSchema>
): Promise<ActionResult<{ reordered: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = reorderAttachmentsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    const reordered = dbReorderAttachments(
      parsed.data.itemId,
      userId,
      parsed.data.orderedIds
    );

    if (!reordered) {
      return { success: false, error: "Could not reorder attachments" };
    }

    revalidatePath(`/items/${parsed.data.itemId}`);
    return { success: true, data: { reordered: true } };
  } catch (error) {
    console.error("Reorder attachments error:", error);
    return {
      success: false,
      error: "Failed to reorder attachments. Please try again.",
    };
  }
}

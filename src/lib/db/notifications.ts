import { eq, and, sql, desc, isNull, lte, gte } from "drizzle-orm";
import { db, formatDateRequired, formatDate } from "./drizzle-client";
import { notifications, notificationPreferences, items } from "./schema";
import type {
  Notification,
  NewNotification,
  NotificationWithItem,
  NotificationPreferences,
} from "@/types/domain";

// Convert Drizzle notification to domain type
function toDomainNotification(
  row: typeof notifications.$inferSelect
): Notification {
  return {
    id: row.id,
    userId: row.userId,
    itemId: row.itemId,
    type: row.type,
    title: row.title,
    message: row.message,
    triggerDate: formatDateRequired(row.triggerDate),
    isRead: row.isRead,
    recurrenceType: row.recurrenceType ?? "one-time",
    recurrenceEndDate: row.recurrenceEndDate ? formatDateRequired(row.recurrenceEndDate) : null,
    createdAt: formatDateRequired(row.createdAt),
  };
}

function toDomainPreferences(
  row: typeof notificationPreferences.$inferSelect
): NotificationPreferences {
  return {
    userId: row.userId,
    warrantyReminderDays: row.warrantyReminderDays,
    maintenanceReminderDays: row.maintenanceReminderDays,
    notificationsEnabled: row.notificationsEnabled,
    createdAt: formatDateRequired(row.createdAt),
    updatedAt: formatDateRequired(row.updatedAt),
  };
}

// Get all notifications for a user (with optional unread filter)
export async function getNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<NotificationWithItem[]> {
  const { unreadOnly = false, limit = 50 } = options;

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const rows = await db
    .select({
      notification: notifications,
      itemId: items.id,
      itemName: items.name,
    })
    .from(notifications)
    .leftJoin(items, eq(notifications.itemId, items.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...toDomainNotification(row.notification),
    item: row.itemId
      ? {
          id: row.itemId,
          name: row.itemName ?? "",
        }
      : null,
  }));
}

// Get count of unread notifications
export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );

  return Number(result?.count ?? 0);
}

// Mark a single notification as read
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    )
    .returning();

  return result.length > 0;
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    )
    .returning();

  return result.length;
}

// Create a new notification
export async function createNotification(
  data: NewNotification
): Promise<Notification> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      itemId: data.itemId ?? null,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      triggerDate: new Date(data.triggerDate),
      recurrenceType: data.recurrenceType ?? "one-time",
      recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create notification");
  }

  return toDomainNotification(row);
}

// Update an existing notification (for custom reminders only)
export async function updateNotification(
  notificationId: string,
  userId: string,
  data: Partial<Pick<NewNotification, "title" | "message" | "triggerDate" | "recurrenceType" | "recurrenceEndDate">>
): Promise<Notification | null> {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.message !== undefined) updateData.message = data.message;
  if (data.triggerDate !== undefined) updateData.triggerDate = new Date(data.triggerDate);
  if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
  if (data.recurrenceEndDate !== undefined) {
    updateData.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
  }

  const [updated] = await db
    .update(notifications)
    .set(updateData)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        eq(notifications.type, "custom_reminder") // Only allow editing custom reminders
      )
    )
    .returning();

  return updated ? toDomainNotification(updated) : null;
}

// Get all reminders for an item (custom + auto-generated)
export async function getItemReminders(
  itemId: string,
  userId: string
): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.itemId, itemId),
        eq(notifications.userId, userId)
      )
    )
    .orderBy(notifications.triggerDate);

  return rows.map(toDomainNotification);
}

// Delete a notification
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(notifications)
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
    )
    .returning();

  return result.length > 0;
}

// Get notification preferences for a user (creates defaults if not exist)
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing) {
    return toDomainPreferences(existing);
  }

  // Create default preferences
  const [created] = await db
    .insert(notificationPreferences)
    .values({ userId })
    .returning();

  if (!created) {
    throw new Error("Failed to create notification preferences");
  }

  return toDomainPreferences(created);
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  data: Partial<
    Pick<
      NotificationPreferences,
      "warrantyReminderDays" | "maintenanceReminderDays" | "notificationsEnabled"
    >
  >
): Promise<NotificationPreferences> {
  // Ensure preferences exist first
  await getNotificationPreferences(userId);

  const [updated] = await db
    .update(notificationPreferences)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(notificationPreferences.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update notification preferences");
  }

  return toDomainPreferences(updated);
}

// Get items with upcoming warranty expiration
export async function getItemsWithUpcomingWarrantyExpiration(
  userId: string,
  reminderDays: number
): Promise<Array<{ id: string; name: string; warrantyExpiresAt: string }>> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      warrantyExpiresAt: items.warrantyExpiresAt,
    })
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        gte(items.warrantyExpiresAt, now),
        lte(items.warrantyExpiresAt, futureDate)
      )
    );

  return rows
    .filter((row) => row.warrantyExpiresAt !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      warrantyExpiresAt: formatDateRequired(row.warrantyExpiresAt!),
    }));
}

// Get items with upcoming maintenance due
export async function getItemsWithUpcomingMaintenance(
  userId: string,
  reminderDays: number
): Promise<
  Array<{
    id: string;
    name: string;
    lastMaintenanceAt: string | null;
    maintenanceIntervalDays: number;
    nextMaintenanceDate: string;
  }>
> {
  const now = new Date();

  // Get items with maintenance schedule
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      lastMaintenanceAt: items.lastMaintenanceAt,
      maintenanceIntervalDays: items.maintenanceIntervalDays,
    })
    .from(items)
    .where(
      and(eq(items.userId, userId), sql`${items.maintenanceIntervalDays} IS NOT NULL`)
    );

  return rows
    .filter((row) => row.maintenanceIntervalDays !== null)
    .map((row) => {
      // Calculate next maintenance date
      const lastMaintenance = row.lastMaintenanceAt
        ? new Date(row.lastMaintenanceAt)
        : new Date(0); // If never maintained, it's overdue
      const nextMaintenance = new Date(
        lastMaintenance.getTime() +
          row.maintenanceIntervalDays! * 24 * 60 * 60 * 1000
      );

      return {
        id: row.id,
        name: row.name,
        lastMaintenanceAt: formatDate(row.lastMaintenanceAt),
        maintenanceIntervalDays: row.maintenanceIntervalDays!,
        nextMaintenanceDate: nextMaintenance.toISOString(),
      };
    })
    .filter((row) => {
      // Filter to items where next maintenance is within reminder window
      const nextMaintenance = new Date(row.nextMaintenanceDate);
      const futureDate = new Date(
        now.getTime() + reminderDays * 24 * 60 * 60 * 1000
      );
      return nextMaintenance <= futureDate;
    });
}

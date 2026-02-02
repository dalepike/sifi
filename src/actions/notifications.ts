"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getNotifications as dbGetNotifications,
  getUnreadCount as dbGetUnreadCount,
  markAsRead as dbMarkAsRead,
  markAllAsRead as dbMarkAllAsRead,
  createNotification as dbCreateNotification,
  deleteNotification as dbDeleteNotification,
  getNotificationPreferences as dbGetPreferences,
  updateNotificationPreferences as dbUpdatePreferences,
} from "@/lib/db/notifications";
import type {
  NotificationWithItem,
  NotificationPreferences,
  Notification,
} from "@/types/domain";
import type { ActionResult } from "./items";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Get notifications for the current user
export async function getNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<
  ActionResult<{ notifications: NotificationWithItem[]; unreadCount: number }>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      dbGetNotifications(userId, options),
      dbGetUnreadCount(userId),
    ]);

    return {
      success: true,
      data: { notifications, unreadCount },
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return {
      success: false,
      error: "Failed to get notifications",
    };
  }
}

// Get unread count only (for badge)
export async function getUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const count = await dbGetUnreadCount(userId);
    return { success: true, data: count };
  } catch (error) {
    console.error("Get unread count error:", error);
    return { success: false, error: "Failed to get unread count" };
  }
}

// Mark a notification as read
export async function markNotificationRead(
  id: string
): Promise<ActionResult<void>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const success = await dbMarkAsRead(id, userId);
    if (!success) {
      return { success: false, error: "Notification not found" };
    }

    revalidatePath("/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Mark notification read error:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(): Promise<ActionResult<void>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    await dbMarkAllAsRead(userId);
    revalidatePath("/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

// Delete a notification
export async function deleteNotification(
  id: string
): Promise<ActionResult<void>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const success = await dbDeleteNotification(id, userId);
    if (!success) {
      return { success: false, error: "Notification not found" };
    }

    revalidatePath("/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete notification error:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<
  ActionResult<NotificationPreferences>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const prefs = await dbGetPreferences(userId);
    return { success: true, data: prefs };
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return { success: false, error: "Failed to get notification preferences" };
  }
}

// Update notification preferences
const updatePreferencesSchema = z.object({
  warrantyReminderDays: z.coerce.number().int().min(1).max(365).optional(),
  maintenanceReminderDays: z.coerce.number().int().min(1).max(365).optional(),
  notificationsEnabled: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export async function updateNotificationPreferences(
  formData: FormData
): Promise<ActionResult<NotificationPreferences>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    warrantyReminderDays: formData.get("warrantyReminderDays") || undefined,
    maintenanceReminderDays:
      formData.get("maintenanceReminderDays") || undefined,
    notificationsEnabled: formData.get("notificationsEnabled") || undefined,
  };

  const parsed = updatePreferencesSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    const prefs = await dbUpdatePreferences(userId, parsed.data);
    revalidatePath("/settings");
    return { success: true, data: prefs };
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return {
      success: false,
      error: "Failed to update notification preferences",
    };
  }
}

// Create a custom reminder
const createReminderSchema = z.object({
  itemId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().max(500).optional(),
  triggerDate: z.string().datetime(),
});

export async function createCustomReminder(
  formData: FormData
): Promise<ActionResult<Notification>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    itemId: formData.get("itemId"),
    title: formData.get("title"),
    message: formData.get("message") || undefined,
    triggerDate: formData.get("triggerDate"),
  };

  const parsed = createReminderSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    const notification = await dbCreateNotification({
      userId,
      itemId: parsed.data.itemId,
      type: "custom_reminder",
      title: parsed.data.title,
      message: parsed.data.message ?? null,
      triggerDate: parsed.data.triggerDate,
    });

    revalidatePath("/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Create custom reminder error:", error);
    return { success: false, error: "Failed to create reminder" };
  }
}

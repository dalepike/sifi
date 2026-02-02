"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isBefore, startOfDay } from "date-fns";
import {
  getNotifications as dbGetNotifications,
  getUnreadCount as dbGetUnreadCount,
  markAsRead as dbMarkAsRead,
  markAllAsRead as dbMarkAllAsRead,
  createNotification as dbCreateNotification,
  updateNotification as dbUpdateNotification,
  deleteNotification as dbDeleteNotification,
  getNotificationPreferences as dbGetPreferences,
  updateNotificationPreferences as dbUpdatePreferences,
  getItemReminders as dbGetItemReminders,
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

// Zod schema for recurrence - discriminated union
const oneTimeRecurrenceSchema = z.object({
  type: z.literal("one-time"),
});

const recurringRecurrenceSchema = z.object({
  type: z.literal("recurring"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  endDate: z.string().datetime().nullable(),
});

const recurrenceSchema = z.discriminatedUnion("type", [
  oneTimeRecurrenceSchema,
  recurringRecurrenceSchema,
]);

// Future date validation
const futureDateSchema = z.string().datetime().refine(
  (dateStr) => {
    const date = new Date(dateStr);
    return isBefore(startOfDay(new Date()), date);
  },
  { message: "Trigger date must be in the future" }
);

// Create reminder schema with recurrence support
const createReminderSchema = z.object({
  itemId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().max(500, "Message too long").optional(),
  triggerDate: futureDateSchema,
  recurrence: recurrenceSchema,
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;

// Update reminder schema
const updateReminderSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  message: z.string().max(500, "Message too long").optional(),
  triggerDate: futureDateSchema.optional(),
  recurrence: recurrenceSchema.optional(),
});

export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// Create a custom reminder with recurrence support
export async function createCustomReminder(
  input: CreateReminderInput
): Promise<ActionResult<Notification>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = createReminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  // Convert discriminated union to database format
  const recurrenceType = parsed.data.recurrence.type === "one-time"
    ? "one-time"
    : parsed.data.recurrence.frequency;
  const recurrenceEndDate = parsed.data.recurrence.type === "recurring"
    ? parsed.data.recurrence.endDate
    : null;

  try {
    const notification = await dbCreateNotification({
      userId,
      itemId: parsed.data.itemId,
      type: "custom_reminder",
      title: parsed.data.title,
      message: parsed.data.message ?? null,
      triggerDate: parsed.data.triggerDate,
      recurrenceType,
      recurrenceEndDate,
    });

    revalidatePath("/notifications");
    revalidatePath(`/items/${parsed.data.itemId}`);
    return { success: true, data: notification };
  } catch (error) {
    console.error("Create custom reminder error:", error);
    return { success: false, error: "Failed to create reminder" };
  }
}

// Update a custom reminder
export async function updateItemReminder(
  input: UpdateReminderInput
): Promise<ActionResult<Notification>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = updateReminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  // Convert discriminated union to database format if recurrence is being updated
  let recurrenceType: string | undefined;
  let recurrenceEndDate: string | null | undefined;

  if (parsed.data.recurrence) {
    recurrenceType = parsed.data.recurrence.type === "one-time"
      ? "one-time"
      : parsed.data.recurrence.frequency;
    recurrenceEndDate = parsed.data.recurrence.type === "recurring"
      ? parsed.data.recurrence.endDate
      : null;
  }

  try {
    const notification = await dbUpdateNotification(parsed.data.id, userId, {
      title: parsed.data.title,
      message: parsed.data.message,
      triggerDate: parsed.data.triggerDate,
      recurrenceType,
      recurrenceEndDate,
    });

    if (!notification) {
      return { success: false, error: "Reminder not found or cannot be edited" };
    }

    revalidatePath("/notifications");
    if (notification.itemId) {
      revalidatePath(`/items/${notification.itemId}`);
    }
    return { success: true, data: notification };
  } catch (error) {
    console.error("Update reminder error:", error);
    return { success: false, error: "Failed to update reminder" };
  }
}

// Delete a custom reminder
export async function deleteItemReminder(
  id: string
): Promise<ActionResult<void>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const success = await dbDeleteNotification(id, userId);
    if (!success) {
      return { success: false, error: "Reminder not found" };
    }

    revalidatePath("/notifications");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete reminder error:", error);
    return { success: false, error: "Failed to delete reminder" };
  }
}

// Get all reminders for an item
export async function getItemReminders(
  itemId: string
): Promise<ActionResult<Notification[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const reminders = await dbGetItemReminders(itemId, userId);
    return { success: true, data: reminders };
  } catch (error) {
    console.error("Get item reminders error:", error);
    return { success: false, error: "Failed to get reminders" };
  }
}

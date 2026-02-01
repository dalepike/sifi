"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createActivity as dbCreateActivity,
  updateActivity as dbUpdateActivity,
  deleteActivity as dbDeleteActivity,
  getActivityById as dbGetActivityById,
  getActivitiesByUserId,
  getActivityItemCount,
} from "@/lib/db/activities";
import type { Activity, ActivityStatus, ActivityWithItemCount } from "@/types/domain";

const activitySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  status: z.enum(["active", "archived"]).optional(),
});

const updateActivitySchema = z.object({
  id: z.string().uuid("Invalid activity ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createActivity(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: (formData.get("status") as ActivityStatus) || "active",
  };

  const parsed = activitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { name, description, status } = parsed.data;

  try {
    const activity = dbCreateActivity({
      userId,
      name,
      description: description || null,
      status: status || "active",
    });

    revalidatePath("/activities");
    return { success: true, data: activity };
  } catch (error) {
    console.error("Create activity error:", error);
    return {
      success: false,
      error: "Failed to create activity. Please try again.",
    };
  }
}

export async function updateActivity(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description"),
    status: formData.get("status") || undefined,
  };

  const parsed = updateActivitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { id, name, description, status } = parsed.data;

  // Verify activity exists and belongs to user
  const existing = dbGetActivityById(id, userId);
  if (!existing) {
    return { success: false, error: "Activity not found" };
  }

  try {
    const activity = dbUpdateActivity(id, userId, {
      name,
      description: description !== undefined ? description || null : undefined,
      status,
    });

    if (!activity) {
      return { success: false, error: "Failed to update activity" };
    }

    revalidatePath("/activities");
    return { success: true, data: activity };
  } catch (error) {
    console.error("Update activity error:", error);
    return {
      success: false,
      error: "Failed to update activity. Please try again.",
    };
  }
}

export async function deleteActivity(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify activity exists and belongs to user
  const existing = dbGetActivityById(id, userId);
  if (!existing) {
    return { success: false, error: "Activity not found" };
  }

  try {
    const deleted = dbDeleteActivity(id, userId);
    revalidatePath("/activities");
    return { success: true, data: { deleted } };
  } catch (error) {
    console.error("Delete activity error:", error);
    return {
      success: false,
      error: "Failed to delete activity. Please try again.",
    };
  }
}

export async function getActivity(
  id: string
): Promise<ActionResult<Activity>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const activity = dbGetActivityById(id, userId);
  if (!activity) {
    return { success: false, error: "Activity not found" };
  }

  return { success: true, data: activity };
}

export async function getActivities(
  status?: "active" | "archived"
): Promise<ActionResult<Activity[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const activities = getActivitiesByUserId(userId, status);
  return { success: true, data: activities };
}

export async function getActivityWithItemCount(
  id: string
): Promise<ActionResult<ActivityWithItemCount>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const activity = dbGetActivityById(id, userId);
  if (!activity) {
    return { success: false, error: "Activity not found" };
  }

  const itemCount = getActivityItemCount(id, userId);

  return { success: true, data: { ...activity, itemCount } };
}

export async function archiveActivity(
  id: string
): Promise<ActionResult<Activity>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const existing = dbGetActivityById(id, userId);
  if (!existing) {
    return { success: false, error: "Activity not found" };
  }

  try {
    const activity = dbUpdateActivity(id, userId, { status: "archived" });
    if (!activity) {
      return { success: false, error: "Failed to archive activity" };
    }

    revalidatePath("/activities");
    return { success: true, data: activity };
  } catch (error) {
    console.error("Archive activity error:", error);
    return {
      success: false,
      error: "Failed to archive activity. Please try again.",
    };
  }
}

export async function unarchiveActivity(
  id: string
): Promise<ActionResult<Activity>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const existing = dbGetActivityById(id, userId);
  if (!existing) {
    return { success: false, error: "Activity not found" };
  }

  try {
    const activity = dbUpdateActivity(id, userId, { status: "active" });
    if (!activity) {
      return { success: false, error: "Failed to unarchive activity" };
    }

    revalidatePath("/activities");
    return { success: true, data: activity };
  } catch (error) {
    console.error("Unarchive activity error:", error);
    return {
      success: false,
      error: "Failed to unarchive activity. Please try again.",
    };
  }
}

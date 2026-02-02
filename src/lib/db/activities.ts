import { eq, and, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { activities, activityItems } from "./schema";
import type { Activity, NewActivity } from "@/types/domain";

// Convert Drizzle activity to domain Activity type
function toDomainActivity(row: typeof activities.$inferSelect): Activity {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    color: row.color ?? "#6b7280",
    icon: row.icon ?? "folder",
    status: row.status ?? "active",
    createdAt: formatDateRequired(row.createdAt),
    updatedAt: formatDateRequired(row.updatedAt),
  };
}

export async function createActivity(data: NewActivity): Promise<Activity> {
  const [row] = await db
    .insert(activities)
    .values({
      id: data.id,
      userId: data.userId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? "#6b7280",
      icon: data.icon ?? "folder",
      status: data.status ?? "active",
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create activity");
  }

  return toDomainActivity(row);
}

export async function getActivityById(
  id: string,
  userId: string
): Promise<Activity | undefined> {
  const [row] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)))
    .limit(1);

  return row ? toDomainActivity(row) : undefined;
}

export async function getActivitiesByUserId(
  userId: string,
  status?: "active" | "archived"
): Promise<Activity[]> {
  const conditions = status
    ? and(eq(activities.userId, userId), eq(activities.status, status))
    : eq(activities.userId, userId);

  const rows = await db
    .select()
    .from(activities)
    .where(conditions)
    .orderBy(activities.name);

  return rows.map(toDomainActivity);
}

export async function updateActivity(
  id: string,
  userId: string,
  data: Partial<NewActivity>
): Promise<Activity | undefined> {
  const updateData: Partial<typeof activities.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.color !== undefined) {
    updateData.color = data.color;
  }
  if (data.icon !== undefined) {
    updateData.icon = data.icon;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt, no actual changes
    return getActivityById(id, userId);
  }

  const [row] = await db
    .update(activities)
    .set(updateData)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)))
    .returning();

  return row ? toDomainActivity(row) : undefined;
}

export async function deleteActivity(
  id: string,
  userId: string
): Promise<boolean> {
  // Activity-item relationships will be cascade deleted
  const result = await db
    .delete(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId)))
    .returning();

  return result.length > 0;
}

export async function getActivityItemCount(
  id: string,
  userId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityItems)
    .innerJoin(activities, eq(activityItems.activityId, activities.id))
    .where(
      and(eq(activityItems.activityId, id), eq(activities.userId, userId))
    );

  return Number(result?.count ?? 0);
}

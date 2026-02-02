"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle-client";
import { locations, items, tags, activities } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface UserStats {
  locationCount: number;
  itemCount: number;
  tagCount: number;
  activityCount: number;
}

export async function getUserStats(): Promise<ActionResult<UserStats>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const [locationResult] = await db
      .select({ count: count() })
      .from(locations)
      .where(eq(locations.userId, userId));

    const [itemResult] = await db
      .select({ count: count() })
      .from(items)
      .where(eq(items.userId, userId));

    const [tagResult] = await db
      .select({ count: count() })
      .from(tags)
      .where(eq(tags.userId, userId));

    const [activityResult] = await db
      .select({ count: count() })
      .from(activities)
      .where(eq(activities.userId, userId));

    return {
      success: true,
      data: {
        locationCount: locationResult?.count ?? 0,
        itemCount: itemResult?.count ?? 0,
        tagCount: tagResult?.count ?? 0,
        activityCount: activityResult?.count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { success: false, error: "Failed to fetch user statistics" };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle-client";
import { users, notificationPreferences, notifications, items } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

// Authenticate cron requests
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow requests without secret
  if (process.env.NODE_ENV === "development" && !cronSecret) {
    return true;
  }

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify cron authentication
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    let warrantyNotificationsCreated = 0;
    let maintenanceNotificationsCreated = 0;

    // Get all users with their notification preferences
    const usersWithPrefs = await db
      .select({
        userId: users.id,
        warrantyReminderDays: notificationPreferences.warrantyReminderDays,
        maintenanceReminderDays: notificationPreferences.maintenanceReminderDays,
        notificationsEnabled: notificationPreferences.notificationsEnabled,
      })
      .from(users)
      .leftJoin(
        notificationPreferences,
        eq(users.id, notificationPreferences.userId)
      );

    for (const user of usersWithPrefs) {
      // Skip users with notifications disabled
      if (user.notificationsEnabled === false) {
        continue;
      }

      // Use default values if no preferences set
      const warrantyDays = user.warrantyReminderDays ?? 30;
      const maintenanceDays = user.maintenanceReminderDays ?? 7;

      // Generate warranty expiration notifications
      const warrantyFutureDate = new Date(
        now.getTime() + warrantyDays * 24 * 60 * 60 * 1000
      );

      const itemsWithWarranty = await db
        .select({
          id: items.id,
          name: items.name,
          warrantyExpiresAt: items.warrantyExpiresAt,
        })
        .from(items)
        .where(
          and(
            eq(items.userId, user.userId),
            isNotNull(items.warrantyExpiresAt),
            gte(items.warrantyExpiresAt, now),
            lte(items.warrantyExpiresAt, warrantyFutureDate)
          )
        );

      for (const item of itemsWithWarranty) {
        if (!item.warrantyExpiresAt) continue;

        try {
          await db
            .insert(notifications)
            .values({
              userId: user.userId,
              itemId: item.id,
              type: "warranty_expiration",
              title: `Warranty expiring: ${item.name}`,
              triggerDate: item.warrantyExpiresAt,
            })
            .onConflictDoNothing({
              target: [
                notifications.itemId,
                notifications.type,
                notifications.triggerDate,
              ],
            });
          warrantyNotificationsCreated++;
        } catch (err) {
          // Ignore duplicate errors
        }
      }

      // Generate maintenance due notifications
      const maintenanceFutureDate = new Date(
        now.getTime() + maintenanceDays * 24 * 60 * 60 * 1000
      );

      const itemsWithMaintenance = await db
        .select({
          id: items.id,
          name: items.name,
          lastMaintenanceAt: items.lastMaintenanceAt,
          maintenanceIntervalDays: items.maintenanceIntervalDays,
        })
        .from(items)
        .where(
          and(
            eq(items.userId, user.userId),
            isNotNull(items.maintenanceIntervalDays)
          )
        );

      for (const item of itemsWithMaintenance) {
        if (!item.maintenanceIntervalDays) continue;

        // Calculate next maintenance date
        const lastMaintenance = item.lastMaintenanceAt
          ? new Date(item.lastMaintenanceAt)
          : new Date(0); // Never maintained = overdue

        const nextMaintenanceDate = new Date(
          lastMaintenance.getTime() +
            item.maintenanceIntervalDays * 24 * 60 * 60 * 1000
        );

        // Check if within reminder window
        if (nextMaintenanceDate <= maintenanceFutureDate) {
          try {
            await db
              .insert(notifications)
              .values({
                userId: user.userId,
                itemId: item.id,
                type: "maintenance_due",
                title: `Maintenance due: ${item.name}`,
                triggerDate: nextMaintenanceDate,
              })
              .onConflictDoNothing({
                target: [
                  notifications.itemId,
                  notifications.type,
                  notifications.triggerDate,
                ],
              });
            maintenanceNotificationsCreated++;
          } catch (err) {
            // Ignore duplicate errors
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      warrantyNotificationsCreated,
      maintenanceNotificationsCreated,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error generating notifications:", error);
    return NextResponse.json(
      { error: "Failed to generate notifications" },
      { status: 500 }
    );
  }
}

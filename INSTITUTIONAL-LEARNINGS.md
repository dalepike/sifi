# SiFi Institutional Learnings: Notifications, Reminders & Scheduling

**Document Date:** February 2, 2026
**Context:** Completed notification system implementation (Release 2)
**Related Files:**
- Plan: `/Users/dalepike/Projects/sifi/docs/plans/2026-02-01-feat-notifications-release-2-plan.md`
- Schema: `/Users/dalepike/Projects/sifi/src/lib/db/schema.ts`
- Database Layer: `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts`
- Server Actions: `/Users/dalepike/Projects/sifi/src/actions/notifications.ts`
- Cron Job: `/Users/dalepike/Projects/sifi/src/app/api/cron/generate-notifications/route.ts`

---

## 1. Database Schema Patterns for Date/Time Handling

### Items Table - Date Fields Structure

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/schema.ts` (lines 82-85)

```typescript
// Add to items table
warrantyExpiresAt: timestamp("warranty_expires_at"),
maintenanceIntervalDays: integer("maintenance_interval_days"),
lastMaintenanceAt: timestamp("last_maintenance_at"),
// Note: purchaseDate was planned but not added in current phase
```

**Key Learning:**
- Use nullable `timestamp` fields for optional date information (warranty, last maintenance)
- Use `integer` for interval durations in days (NOT timestamps) - simpler math
- This allows items without warranty/maintenance tracking to coexist with those that have it

### Notifications Table Structure

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/schema.ts` (lines 196-226)

```typescript
export const notificationTypeEnum = pgEnum("notification_type", [
  "warranty_expiration",
  "maintenance_due",
  "custom_reminder",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  triggerDate: timestamp("trigger_date").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notifications_user_unread_idx").on(table.userId, table.isRead),
  uniqueIndex("notifications_item_type_date_idx").on(table.itemId, table.type, table.triggerDate),
]);
```

**Key Learning:**
- **Deduplication via unique constraint:** `notifications_item_type_date_idx` prevents duplicate notifications for the same item + type + date combination
- **Two-field read tracking:** `isRead` boolean (not timestamp) simpler than `readAt`/`dismissedAt`; dismissal handled separately via deletion
- **Indexes matter:** `notifications_user_unread_idx` makes unread badge queries fast
- **Optional itemId:** Supports custom reminders without an item

### User Preferences Table

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/schema.ts` (lines 228-240)

```typescript
export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  warrantyReminderDays: integer("warranty_reminder_days").default(30).notNull(),
  maintenanceReminderDays: integer("maintenance_reminder_days").default(7).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Learning:**
- **One row per user:** Use user_id as primary key to prevent duplicates
- **Sensible defaults:** 30 days for warranty, 7 days for maintenance
- **Auto-create on first access:** Database layer creates defaults if not found (see notifications.ts getNotificationPreferences)

---

## 2. Date/Time Calculation Patterns

### Warranty Expiration Calculation

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 234-264)

```typescript
export async function getItemsWithUpcomingWarrantyExpiration(
  userId: string,
  reminderDays: number
): Promise<Array<{ id: string; name: string; warrantyExpiresAt: string }>> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ id: items.id, name: items.name, warrantyExpiresAt: items.warrantyExpiresAt })
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
```

**Key Learning:**
- **Time window calculation:** `new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000)` is the standard pattern
- **Query filtering:** Use `gte(now)` and `lte(futureDate)` to find items within window
- **Database filters null:** `where` clause filters; still apply TypeScript checks post-query

### Maintenance Due Calculation

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 266-322)

```typescript
export async function getItemsWithUpcomingMaintenance(
  userId: string,
  reminderDays: number
): Promise<Array<{ id: string; nextMaintenanceDate: string; ... }>> {
  const now = new Date();
  const rows = await db.select(...).from(items)
    .where(and(eq(items.userId, userId), sql`${items.maintenanceIntervalDays} IS NOT NULL`));

  return rows
    .filter((row) => row.maintenanceIntervalDays !== null)
    .map((row) => {
      // Calculate next maintenance date
      const lastMaintenance = row.lastMaintenanceAt
        ? new Date(row.lastMaintenanceAt)
        : new Date(0); // Never maintained = epoch (overdue)

      const nextMaintenance = new Date(
        lastMaintenance.getTime() + row.maintenanceIntervalDays! * 24 * 60 * 60 * 1000
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
      const nextMaintenance = new Date(row.nextMaintenanceDate);
      const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);
      return nextMaintenance <= futureDate;
    });
}
```

**Key Learning:**
- **Handling never-maintained items:** Use `new Date(0)` (epoch) as fallback when `lastMaintenanceAt` is null, making them overdue
- **Calculate after fetch:** Maintenance math can't be done in SQL efficiently; calculate in JS then filter
- **Interval math:** `lastMaintenance + (interval * 24 * 60 * 60 * 1000)` milliseconds

---

## 3. CRUD Operations with Authentication

### Create/Insert Pattern

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 118-161)

```typescript
export async function createNotification(data: NewNotification): Promise<Notification> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      itemId: data.itemId ?? null,
      type: data.type,
      title: data.title,
      message: data.message ?? null,
      triggerDate: new Date(data.triggerDate),
    })
    .onConflictDoNothing({  // Deduplication
      target: [notifications.itemId, notifications.type, notifications.triggerDate],
    })
    .returning();

  if (!row) {
    // Notification already exists, fetch it
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.itemId, data.itemId ?? ""),
          eq(notifications.type, data.type),
          eq(notifications.triggerDate, new Date(data.triggerDate))
        )
      )
      .limit(1);

    if (existing) {
      return toDomainNotification(existing);
    }
    throw new Error("Failed to create notification");
  }

  return toDomainNotification(row);
}
```

**Key Learning:**
- **onConflictDoNothing pattern:** Prevents duplicate inserts on unique constraints
- **Idempotent operations:** If conflict occurs, fetch and return existing record
- **Null handling:** Use `?? null` for optional fields; TypeScript needs explicit null for Drizzle

### Read Operations with Scoping

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 41-74)

```typescript
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
      ? { id: row.itemId, name: row.itemName ?? "" }
      : null,
  }));
}
```

**Key Learning:**
- **User scoping:** Always include `eq(notifications.userId, userId)` to prevent data leaks
- **Optional joins:** Use `leftJoin` for optional related data; check null in map
- **Limit at query:** Use `.limit()` instead of JS-side filtering for efficiency
- **Conditional filters:** Build filter array, then spread with `and(...conditions)`

### Update Pattern

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 205-232)

```typescript
export async function updateNotificationPreferences(
  userId: string,
  data: Partial<Pick<NotificationPreferences, "warrantyReminderDays" | "maintenanceReminderDays" | "notificationsEnabled">>
): Promise<NotificationPreferences> {
  // Ensure preferences exist first (creates defaults if missing)
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
```

**Key Learning:**
- **Ensure row exists:** Call read function first to create defaults if needed
- **Partial updates:** Use `Partial<Pick<...>>` to allow selective field updates
- **Always update updatedAt:** Timestamp when preferences change
- **Return updated row:** Use `.returning()` to get the new state

### Delete Pattern

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 163-176)

```typescript
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
```

**Key Learning:**
- **Always include user check:** `eq(notifications.userId, userId)` prevents users from deleting others' notifications
- **Verify success:** Check `.returning().length` to confirm deletion
- **Cascade handles children:** Database CASCADE DELETE handles orphaned notifications when items are deleted

---

## 4. Server Actions Pattern (Server-Side Authentication)

**Location:** `/Users/dalepike/Projects/sifi/src/actions/notifications.ts`

### Authentication Wrapper

```typescript
async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getNotifications(options?: { unreadOnly?: boolean; limit?: number }): Promise<ActionResult<{ ... }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Database call
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false, error: "Failed to get notifications" };
  }
}
```

**Key Learning:**
- **"use server" directive:** Mark actions as server-only
- **Auth check first:** Verify session before database operations
- **Consistent error handling:** Return ActionResult type with success/error fields
- **Console logging:** Log errors server-side, return generic messages to client

### Parallel Operations

**Location:** `/Users/dalepike/Projects/sifi/src/actions/notifications.ts` (lines 40-44)

```typescript
const [notifications, unreadCount] = await Promise.all([
  dbGetNotifications(userId, options),
  dbGetUnreadCount(userId),
]);
```

**Key Learning:**
- Use `Promise.all()` for independent database queries to reduce latency

---

## 5. Cron Job Pattern for Scheduled Notifications

**Location:** `/Users/dalepike/Projects/sifi/src/app/api/cron/generate-notifications/route.ts`

### Authentication

```typescript
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (process.env.NODE_ENV === "development" && !cronSecret) {
    return true;
  }

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
```

**Key Learning:**
- **Bearer token pattern:** Use `Authorization: Bearer <secret>` header
- **Development fallback:** Allow dev without secret for local testing
- **Fail-safe:** Return 401 if secret missing/invalid

### Batch Processing with Deduplication

```typescript
// Process all users and their preferences in one query
const usersWithPrefs = await db
  .select({
    userId: users.id,
    warrantyReminderDays: notificationPreferences.warrantyReminderDays,
    maintenanceReminderDays: notificationPreferences.maintenanceReminderDays,
    notificationsEnabled: notificationPreferences.notificationsEnabled,
  })
  .from(users)
  .leftJoin(notificationPreferences, eq(users.id, notificationPreferences.userId));

for (const user of usersWithPrefs) {
  if (user.notificationsEnabled === false) continue;

  const warrantyDays = user.warrantyReminderDays ?? 30; // Use defaults
  // ... generate notifications for this user
}
```

**Key Learning:**
- **Fetch all users + preferences in one query:** More efficient than n+1
- **Use defaults on null:** If user has no preferences row, use hardcoded defaults
- **Respect opt-out:** Skip users with `notificationsEnabled: false`

### Upsert Pattern in Batch

```typescript
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
    target: [notifications.itemId, notifications.type, notifications.triggerDate],
  });
```

**Key Learning:**
- **onConflictDoNothing:** Silently ignores duplicates; no error thrown
- **Idempotent:** Safe to run cron job multiple times on same day
- **Unique constraint target:** Matches the `notifications_item_type_date_idx` index

---

## 6. Type Safety & Date Formatting

### Domain Type Conversion

**Location:** `/Users/dalepike/Projects/sifi/src/lib/db/notifications.ts` (lines 11-39)

```typescript
function toDomainNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    itemId: row.itemId,
    type: row.type,
    title: row.title,
    message: row.message,
    triggerDate: formatDateRequired(row.triggerDate),
    isRead: row.isRead,
    createdAt: formatDateRequired(row.createdAt),
  };
}
```

**Key Learning:**
- **Use Drizzle inference:** `typeof notifications.$inferSelect` for type-safe row access
- **Format dates at boundary:** Convert timestamps to ISO strings before returning to client
- **Domain vs database types:** Separate layer prevents mixing string/Date confusion

### Date Formatting Utilities

```typescript
import { formatDateRequired, formatDate } from "./drizzle-client";

// Mandatory date (never null)
triggerDate: formatDateRequired(row.triggerDate)

// Optional date (may be null)
lastMaintenanceAt: formatDate(row.lastMaintenanceAt)
```

**Key Learning:**
- **Two formatting functions:** Required vs optional dates handled separately
- **Use utility functions:** Consistent ISO 8601 format across app

---

## 7. UI Integration Points

### Components Structure

- **Notification Bell:** `/Users/dalepike/Projects/sifi/src/components/notifications/notification-bell.tsx`
  - Displays unread count badge (shows "99+" for overflow)
  - Polls every 30 seconds via SWR

- **Notifications Page:** `/Users/dalepike/Projects/sifi/src/app/(app)/notifications/page.tsx`
  - Full list with pagination
  - Filter tabs (All/Unread/Read)
  - Click to navigate to item detail

- **Settings Integration:** `/Users/dalepike/Projects/sifi/src/app/(app)/settings/notification-settings.tsx`
  - Configure warranty reminder days (1-365)
  - Configure maintenance reminder days (1-365)
  - Master enable/disable toggle

### SWR Polling Pattern

```typescript
function useNotifications() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 30000,  // 30 second polling
    revalidateOnFocus: true,  // Re-fetch when window focused
  });
  // ... return data + mutation functions
}
```

**Key Learning:**
- **30-second polling:** Balance between responsiveness and server load
- **revalidateOnFocus:** Pick up changes when user returns to tab
- **No WebSocket needed:** SWR polling sufficient for notification use case

---

## 8. Edge Cases & Handling

| Edge Case | Handling | Location |
|-----------|----------|----------|
| Item deleted with pending notifications | `ON DELETE CASCADE` removes notifications | schema.ts |
| Duplicate cron runs | `uniqueIndex` + `onConflictDoNothing` | cron route |
| User ignores expired warranty | One-time trigger, no repeat | data model |
| 100+ unread notifications | Badge shows "99+" | UI |
| Network failure during polling | SWR shows last cached count | UI hook |
| No warranty date set | No notification generated | cron logic |
| Never maintained item | Treated as epoch (overdue) | notifications.ts line 300 |
| User with no preferences | Auto-created on first access | notifications.ts line 193 |

---

## 9. Design Decisions & Rationale

| Decision | Choice | Reason |
|----------|--------|--------|
| Read vs Dismiss | Simple `isRead` boolean | Clear semantics; no need for both timestamps |
| Notification generation | Daily cron job | Predictable, efficient batch processing |
| Deduplication | Unique constraint on (item, type, date) | Prevents duplicates at database level |
| Cascade delete | `ON DELETE CASCADE` for item FK | Orphaned notifications auto-cleaned |
| Timing defaults | Warranty: 30 days, Maintenance: 7 days | Sensible business defaults |
| Badge overflow | Show "99+" | Clean UI for power users with 100+ unread |
| Polling vs WebSocket | 30s SWR polling | Simpler infrastructure, sufficient responsiveness |

---

## 10. What's NOT Implemented (Deferred)

- Email notifications (in-app only)
- Push notifications (would need service worker)
- Recurring custom reminders (custom is one-time for MVP)
- Multiple timing per type (single timing per type)
- Per-item timing override (global preferences only)
- Snooze functionality (gather user feedback first)

---

## 11. Key Files Summary

| File | Purpose | Key Functions |
|------|---------|---|
| `src/lib/db/schema.ts` | Database schema | `items`, `notifications`, `notificationPreferences` tables + enums |
| `src/lib/db/notifications.ts` | Database layer | CRUD functions, date calculations, deduplication logic |
| `src/actions/notifications.ts` | Server actions | User-facing API with auth checks, error handling |
| `src/app/api/cron/generate-notifications/route.ts` | Scheduled task | Daily notification generation with batch processing |
| `src/components/notifications/notification-bell.tsx` | UI component | Badge, dropdown, SWR polling hook |
| `src/app/(app)/notifications/page.tsx` | Full notifications page | List, filtering, pagination |
| `src/app/(app)/settings/notification-settings.tsx` | Settings integration | Preference form with validation |

---

## 12. When to Apply These Patterns

Use this reference for:
- **Adding new notification types** (e.g., "threshold_exceeded"): Add to enum, create calculation function, add cron logic
- **Custom reminder features:** Extend item form with date picker, use same notification table structure
- **Other reminder systems** (tasks, events, etc.): Follow the same CRUD + cron batch pattern
- **Recurring schedules:** Extend `maintenanceIntervalDays` pattern; calculate next occurrence from last one
- **User preferences:** Mirror `notificationPreferences` table pattern with upsert on first access

---

**Last Updated:** February 2, 2026
**Status:** Production (Release 2 complete)

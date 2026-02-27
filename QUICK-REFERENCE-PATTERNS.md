# SiFi Quick Reference: Notifications & Scheduling Patterns

## Time Window Calculations

### Warranty Expiration (Fixed Date)
```typescript
const now = new Date();
const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

// Find items expiring soon
.where(
  and(
    gte(items.warrantyExpiresAt, now),           // Not yet expired
    lte(items.warrantyExpiresAt, futureDate)     // Within reminder window
  )
)
```

### Maintenance Due (Calculated from Interval)
```typescript
const lastMaintenance = row.lastMaintenanceAt ? new Date(row.lastMaintenanceAt) : new Date(0);
const nextMaintenance = new Date(
  lastMaintenance.getTime() + row.maintenanceIntervalDays * 24 * 60 * 60 * 1000
);

// Check if due within reminder window
if (nextMaintenance <= futureDate) {
  // Create notification
}
```

## CRUD with User Scoping

### Always Include User Check
```typescript
// READ
.where(and(eq(notifications.userId, userId), ...otherConditions))

// UPDATE
.where(and(eq(notifications.userId, userId), eq(notifications.id, id)))

// DELETE
.where(and(eq(notifications.userId, userId), eq(notifications.id, id)))
```

## Deduplication Pattern

### Insert with Conflict Handling
```typescript
.insert(notifications)
.values({ userId, itemId, type, title, triggerDate })
.onConflictDoNothing({
  target: [notifications.itemId, notifications.type, notifications.triggerDate]
})
.returning()
```

### Idempotent Operation
```typescript
const [row] = await insertWithConflict();
if (!row) {
  // Already exists - fetch it
  const [existing] = await db.select().from(notifications).where(...).limit(1);
  return existing;
}
return row;
```

## Server Action Template

```typescript
"use server";

import { auth } from "@/lib/auth";
import type { ActionResult } from "./items";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function myAction(input: any): Promise<ActionResult<any>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Do work
    return { success: true, data: result };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Failed to complete action" };
  }
}
```

## Database Layer CRUD Functions

### Create Function
```typescript
export async function create(userId: string, data: InputType): Promise<OutputType> {
  const [row] = await db.insert(table).values({ userId, ...data }).returning();
  if (!row) throw new Error("Failed to create");
  return toDomainType(row);
}
```

### Read Functions
```typescript
// List with options
export async function getList(userId: string, options: { limit?: number } = {}): Promise<OutputType[]> {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(desc(table.createdAt))
    .limit(options.limit ?? 50);
  return rows.map(toDomainType);
}

// Single item
export async function getById(id: string, userId: string): Promise<OutputType | null> {
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .limit(1);
  return row ? toDomainType(row) : null;
}
```

### Update Function
```typescript
export async function update(id: string, userId: string, data: Partial<InputType>): Promise<OutputType> {
  const [row] = await db
    .update(table)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .returning();
  if (!row) throw new Error("Not found");
  return toDomainType(row);
}
```

### Delete Function
```typescript
export async function delete(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .returning();
  return result.length > 0;
}
```

## Schema Patterns

### Date Fields
```typescript
// Fixed date (nullable)
warrantyExpiresAt: timestamp("warranty_expires_at"),

// Interval in days (for calculations)
maintenanceIntervalDays: integer("maintenance_interval_days"),

// Last occurrence of event
lastMaintenanceAt: timestamp("last_maintenance_at"),

// Timestamps for audit
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),
```

### Indexes for Performance
```typescript
// For unread notifications badge
index("notifications_user_unread_idx").on(table.userId, table.isRead)

// For deduplication
uniqueIndex("notifications_item_type_date_idx").on(
  table.itemId,
  table.type,
  table.triggerDate
)
```

### Cascade Delete
```typescript
userId: uuid("user_id")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" })
```

## Cron Job Pattern

### Authentication
```typescript
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "development" && !cronSecret) {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... do work
}
```

### Batch Processing
```typescript
const users = await db.select(...).from(users).leftJoin(preferences, ...);

for (const user of users) {
  if (user.notificationsEnabled === false) continue;

  const reminderDays = user.reminderDays ?? 30; // Use defaults

  // Process this user's notifications
}
```

## Type Conversions

### From Database to Domain
```typescript
function toDomainType(row: typeof table.$inferSelect): DomainType {
  return {
    id: row.id,
    // ...
    date: formatDateRequired(row.date),
    optionalDate: formatDate(row.optionalDate),
  };
}
```

### Import Utilities
```typescript
import { formatDateRequired, formatDate } from "./drizzle-client";
```

## SWR Hook Pattern

```typescript
import useSWR from "swr";

function useNotifications() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 30000,      // Poll every 30 seconds
    revalidateOnFocus: true,      // Re-fetch on window focus
    dedupingInterval: 2000,       // Dedupe within 2 seconds
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading: !data,
    refresh: mutate,
  };
}
```

## Default Values Strategy

### For User Preferences
```typescript
// In database
warrantyReminderDays: integer("warranty_reminder_days").default(30).notNull(),

// In application code
const reminderDays = preferences?.warrantyReminderDays ?? 30;
```

### For Null Handling
```typescript
// Never maintained = epoch (overdue)
const lastMaintenance = row.lastMaintenanceAt
  ? new Date(row.lastMaintenanceAt)
  : new Date(0);
```

## Testing Checklist

- [ ] User scoping: Verify users can't see others' notifications
- [ ] Date calculations: Test edge cases (today, tomorrow, year boundary)
- [ ] Deduplication: Run cron twice, verify no duplicate notifications
- [ ] Cascade delete: Delete item, verify notifications deleted
- [ ] Preferences: Test with default values if preferences row missing
- [ ] Authentication: Test cron with/without valid secret
- [ ] Null handling: Test with missing dates/intervals
- [ ] Type safety: Verify TypeScript catches date/string confusion

---

**Related Full Documentation:** `/Users/dalepike/Projects/sifi/INSTITUTIONAL-LEARNINGS.md`

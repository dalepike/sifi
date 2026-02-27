# How to Apply SiFi Patterns to Your Specific Use Cases

This document shows how to use the documented SiFi notification patterns for each of your requested use cases.

---

## 1. Notifications - Generic Alerts & Events

**Status in SiFi:** FULLY IMPLEMENTED
**Reference:** `src/lib/db/notifications.ts`, schema.ts notifications table

### Your Use Case: New notification types (e.g., "threshold_exceeded", "item_damaged")

**Step 1: Add to Enum**
```typescript
// schema.ts
export const notificationTypeEnum = pgEnum("notification_type", [
  "warranty_expiration",
  "maintenance_due",
  "custom_reminder",
  "threshold_exceeded",  // ADD THIS
  "item_damaged",        // ADD THIS
]);
```

**Step 2: Create Calculation Function**
```typescript
// notifications.ts
export async function getItemsWithThresholdExceeded(
  userId: string,
  threshold: number
): Promise<Array<{ id: string; name: string; currentValue: number }>> {
  const rows = await db
    .select({ id: items.id, name: items.name, currentValue: items.currentValue })
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        lt(items.currentValue, threshold)  // Below threshold
      )
    );

  return rows;
}
```

**Step 3: Add Cron Logic**
```typescript
// cron/generate-notifications/route.ts
const itemsWithThreshold = await getItemsWithThresholdExceeded(userId, 50);

for (const item of itemsWithThreshold) {
  await db
    .insert(notifications)
    .values({
      userId,
      itemId: item.id,
      type: "threshold_exceeded",
      title: `Value alert: ${item.name}`,
      triggerDate: new Date(),
    })
    .onConflictDoNothing({
      target: [notifications.itemId, notifications.type, notifications.triggerDate],
    });
}
```

---

## 2. Reminders - User-Defined Time-Based Alerts

**Status in SiFi:** PARTIALLY IMPLEMENTED
**Reference:** `custom_reminder` notification type
**Missing:** Dialog UI for reminder creation (deferred)

### Your Use Case: Custom reminders with date picker

**Full Implementation Pattern:**

**1. Add Server Action for Creating Reminder**
```typescript
// actions/notifications.ts
"use server";

const ReminderSchema = z.object({
  itemId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  message: z.string().max(1000).optional(),
  reminderDate: z.date(),
});

export async function createReminder(formData: FormData): Promise<ActionResult<Notification>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const parsed = ReminderSchema.parse({
      itemId: formData.get("itemId"),
      title: formData.get("title"),
      message: formData.get("message"),
      reminderDate: new Date(formData.get("reminderDate") as string),
    });

    const notification = await dbCreateNotification({
      userId,
      itemId: parsed.itemId ?? null,
      type: "custom_reminder",
      title: parsed.title,
      message: parsed.message ?? null,
      triggerDate: parsed.reminderDate,
    });

    revalidatePath("/notifications");
    return { success: true, data: notification };
  } catch (error) {
    console.error("Create reminder error:", error);
    return { success: false, error: "Failed to create reminder" };
  }
}
```

**2. Create Reminder Dialog Component**
```typescript
// components/reminders/reminder-dialog.tsx
"use client";

import { useState } from "react";
import { createReminder } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReminderDialog({ itemId }: { itemId?: string }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (itemId) formData.set("itemId", itemId);

    const result = await createReminder(formData);
    if (result.success) {
      setOpen(false);
    }
  }

  return (
    // Dialog with date/time picker, title, message
    // Form calls handleSubmit
  );
}
```

**3. Add to Item Detail Page**
```typescript
// app/(app)/items/[id]/page.tsx
import { ReminderDialog } from "@/components/reminders/reminder-dialog";

export default async function ItemDetail({ params: { id } }) {
  // ... get item

  return (
    <div>
      {/* Item details */}
      <ReminderDialog itemId={id} />
    </div>
  );
}
```

---

## 3. Scheduling - Recurring Events & Tasks

**Status in SiFi:** NOT IMPLEMENTED (deferred)
**Pattern to Use:** Extend maintenance interval pattern

### Your Use Case: Recurring tasks (e.g., "Every Monday at 2 PM")

**Implementation Pattern:**

**1. Add Schedule Fields to Items/Tasks Table**
```typescript
// schema.ts
export const recurringTasks = pgTable("recurring_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),

  // Recurrence pattern
  recurrenceType: pgEnum("recurrence_type", ["daily", "weekly", "biweekly", "monthly"])("type"),
  recurrenceIntervalDays: integer("recurrence_interval_days").notNull(), // Computed from type

  // Schedule management
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // null = never ends
  lastOccurredAt: timestamp("last_occurred_at"),
  nextOccurrenceAt: timestamp("next_occurrence_at").notNull(),

  // Timing
  scheduledHour: integer("scheduled_hour").default(9), // 0-23
  scheduledMinute: integer("scheduled_minute").default(0), // 0-59

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("recurring_tasks_user_next_idx").on(table.userId, table.nextOccurrenceAt),
  index("recurring_tasks_status_idx").on(table.userId, table.endDate),
]);
```

**2. Calculate Next Occurrence**
```typescript
// lib/db/recurring-tasks.ts
function calculateNextOccurrence(
  lastOccurrence: Date,
  intervalDays: number,
  scheduledHour: number,
  scheduledMinute: number,
  endDate: Date | null
): Date {
  const next = new Date(
    lastOccurrence.getTime() + intervalDays * 24 * 60 * 60 * 1000
  );

  // Set time of day
  next.setHours(scheduledHour, scheduledMinute, 0, 0);

  // If past endDate, return null (schedule ends)
  if (endDate && next > endDate) {
    return null;
  }

  return next;
}

export async function updateRecurringTask(
  id: string,
  userId: string
): Promise<void> {
  const task = await getTask(id, userId);
  if (!task) return;

  const lastOccurrence = task.lastOccurredAt || task.startDate;
  const nextOccurrence = calculateNextOccurrence(
    lastOccurrence,
    task.recurrenceIntervalDays,
    task.scheduledHour,
    task.scheduledMinute,
    task.endDate
  );

  if (nextOccurrence) {
    await db
      .update(recurringTasks)
      .set({
        lastOccurredAt: new Date(),
        nextOccurrenceAt: nextOccurrence,
        updatedAt: new Date(),
      })
      .where(and(eq(recurringTasks.id, id), eq(recurringTasks.userId, userId)));
  }
}
```

**3. Cron Job to Generate Notifications**
```typescript
// app/api/cron/schedule-notifications/route.ts
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const dueSchedules = await db
  .select()
  .from(recurringTasks)
  .where(
    and(
      gte(recurringTasks.nextOccurrenceAt, now),
      lte(recurringTasks.nextOccurrenceAt, tomorrow),
      or(
        isNull(recurringTasks.endDate),
        gte(recurringTasks.endDate, now)
      )
    )
  );

for (const schedule of dueSchedules) {
  // Create notification
  await db.insert(notifications).values({
    userId: schedule.userId,
    title: schedule.title,
    triggerDate: schedule.nextOccurrenceAt,
    type: "scheduled_task",
  });

  // Update for next occurrence
  await updateRecurringTask(schedule.id, schedule.userId);
}
```

---

## 4. Recurrence Patterns - Complex Scheduling

**Status in SiFi:** NOT IMPLEMENTED
**Pattern to Use:** Interval-based calculation (proven in maintenance)

### Your Use Case: Complex rules (e.g., "2nd Tuesday of month", "Every 3 weeks on Friday")

**Implementation Strategy:**

**1. Use RRule Library** (external dependency)
```bash
npm install rrule
```

**2. Store as RRule String**
```typescript
// schema.ts
export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),

  // RRule format: "FREQ=WEEKLY;BYDAY=TU;INTERVAL=2"
  rrule: text("rrule").notNull(),

  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  lastGeneratedAt: timestamp("last_generated_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**3. Generate Occurrences**
```typescript
// lib/db/schedules.ts
import { RRule } from "rrule";

export async function generateScheduleOccurrences(
  userId: string,
  daysAhead: number = 30
) {
  const schedules = await db
    .select()
    .from(schedules)
    .where(eq(schedules.userId, userId));

  for (const schedule of schedules) {
    const rule = RRule.fromString(schedule.rrule);
    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Get next 100 occurrences up to endDate
    const occurrences = rule.between(now, endDate, true);

    for (const occurrence of occurrences) {
      await db
        .insert(notifications)
        .values({
          userId,
          title: schedule.title,
          type: "scheduled",
          triggerDate: occurrence,
        })
        .onConflictDoNothing({
          target: [notifications.itemId, notifications.type, notifications.triggerDate],
        });
    }

    // Update last generated
    await db
      .update(schedules)
      .set({ lastGeneratedAt: now })
      .where(eq(schedules.id, schedule.id));
  }
}
```

---

## 5. Date/Time Handling - Time Zones & Formatting

**Status in SiFi:** IMPLEMENTED (UTC with ISO formatting)
**Reference:** `drizzle-client.ts` formatDate functions

### Best Practices to Apply:

**1. Always Store in UTC**
```typescript
// Database stores UTC
createdAt: timestamp("created_at").defaultNow().notNull(), // UTC
triggerDate: timestamp("trigger_date").notNull(),           // UTC
```

**2. Format at Boundaries**
```typescript
// At response time
return {
  ...notification,
  triggerDate: formatDateRequired(row.triggerDate), // ISO string
  createdAt: formatDateRequired(row.createdAt),
};
```

**3. Client-Side Formatting**
```typescript
// On frontend
const localTime = new Date(isoString).toLocaleString("en-US", {
  timeZone: userTimeZone,
  dateStyle: "short",
  timeStyle: "short",
});
```

**4. Handle Timezone in Calculations**
```typescript
// Don't assume user's timezone in cron job
// Just use UTC for all server calculations
const now = new Date(); // UTC
const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000); // UTC

// Client interprets in their timezone via toLocaleString()
```

---

## 6. CRUD Operations - Full Pattern Reference

**Status in SiFi:** FULLY IMPLEMENTED
**Reference:** Every table in `src/lib/db/`

### Template for Any New Entity:

**Database File: `src/lib/db/entity.ts`**
```typescript
import { eq, and, desc } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { yourTable } from "./schema";
import type { YourEntity, NewYourEntity } from "@/types/domain";

// Convert Drizzle row to domain type
function toDomainEntity(row: typeof yourTable.$inferSelect): YourEntity {
  return { ...row, createdAt: formatDateRequired(row.createdAt) };
}

// CREATE
export async function create(userId: string, data: NewYourEntity): Promise<YourEntity> {
  const [row] = await db
    .insert(yourTable)
    .values({ userId, ...data })
    .returning();
  if (!row) throw new Error("Failed to create");
  return toDomainEntity(row);
}

// READ (list)
export async function list(userId: string, limit = 50): Promise<YourEntity[]> {
  const rows = await db
    .select()
    .from(yourTable)
    .where(eq(yourTable.userId, userId))
    .orderBy(desc(yourTable.createdAt))
    .limit(limit);
  return rows.map(toDomainEntity);
}

// READ (single)
export async function getById(id: string, userId: string): Promise<YourEntity | null> {
  const [row] = await db
    .select()
    .from(yourTable)
    .where(and(eq(yourTable.id, id), eq(yourTable.userId, userId)))
    .limit(1);
  return row ? toDomainEntity(row) : null;
}

// UPDATE
export async function update(
  id: string,
  userId: string,
  data: Partial<NewYourEntity>
): Promise<YourEntity> {
  const [row] = await db
    .update(yourTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(yourTable.id, id), eq(yourTable.userId, userId)))
    .returning();
  if (!row) throw new Error("Not found");
  return toDomainEntity(row);
}

// DELETE
export async function delete(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(yourTable)
    .where(and(eq(yourTable.id, id), eq(yourTable.userId, userId)))
    .returning();
  return result.length > 0;
}
```

**Server Actions File: `src/actions/entity.ts`**
```typescript
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as db from "@/lib/db/entity";
import type { ActionResult } from "./items";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const EntitySchema = z.object({
  name: z.string().min(1),
  // ... other fields
});

export async function getEntity(id: string): Promise<ActionResult<any>> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const entity = await db.getById(id, userId);
    if (!entity) return { success: false, error: "Not found" };
    return { success: true, data: entity };
  } catch (error) {
    console.error("Get entity error:", error);
    return { success: false, error: "Failed to load" };
  }
}

export async function createEntity(formData: FormData): Promise<ActionResult<any>> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not logged in" };

  try {
    const parsed = EntitySchema.parse({
      name: formData.get("name"),
    });

    const entity = await db.create(userId, parsed);
    revalidatePath("/entities");
    return { success: true, data: entity };
  } catch (error) {
    console.error("Create entity error:", error);
    return { success: false, error: "Failed to create" };
  }
}

// updateEntity, deleteEntity follow same pattern
```

---

## Quick Decision Matrix

| Use Case | SiFi Status | Recommendation |
|----------|-------------|---|
| User notifications (alerts, warnings) | Implemented | Use existing system directly |
| Warranty/maintenance reminders | Implemented | Use as template |
| Custom time-based reminders | Partial | Add dialog UI to complete |
| Recurring daily/weekly tasks | Not implemented | Use maintenance pattern |
| Complex recurrence rules | Not implemented | Use RRule library pattern |
| Date/time formatting | Implemented | Use formatDate() utilities |
| CRUD operations | Implemented | Use entity template |
| User preferences system | Implemented | Mirror preferences pattern |
| Cron job processing | Implemented | Use batch processing pattern |
| SWR data fetching | Implemented | Use 30s polling pattern |

---

**Document Version:** 1.0
**Last Updated:** February 2, 2026
**Status:** Ready to apply

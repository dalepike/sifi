import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const itemTypeEnum = pgEnum("item_type", ["container", "object"]);
export const activityStatusEnum = pgEnum("activity_status", [
  "active",
  "archived",
]);

// Users
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

// Locations (hierarchical)
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    description: text("description"),
    code: text("code").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("locations_user_id_idx").on(table.userId),
    index("locations_parent_id_idx").on(table.parentId),
    uniqueIndex("locations_user_code_idx").on(table.userId, table.code),
  ]
);

// Items (containers or objects)
export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: itemTypeEnum("type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentLocationId: uuid("parent_location_id").references(
      () => locations.id,
      { onDelete: "cascade" }
    ),
    parentItemId: uuid("parent_item_id"),
    photos: text("photos"), // JSON array of photo URLs
    // Warranty and maintenance fields for notifications
    warrantyExpiresAt: timestamp("warranty_expires_at"),
    maintenanceIntervalDays: integer("maintenance_interval_days"),
    lastMaintenanceAt: timestamp("last_maintenance_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("items_user_id_idx").on(table.userId),
    index("items_parent_location_idx").on(table.parentLocationId),
    index("items_parent_item_idx").on(table.parentItemId),
    index("items_name_idx").on(table.name),
  ]
);

// Tags (renamed from categories for clarity, but table keeps 'categories' name for migration)
export const tags = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("tags_user_id_idx").on(table.userId)]
);

// Item-Tags junction (with composite primary key)
export const itemTags = pgTable(
  "item_tags",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.tagId] }),
    index("item_tags_tag_idx").on(table.tagId),
  ]
);

// Activities
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6b7280"), // Gray-500 default
    icon: text("icon").default("folder"), // Default icon name
    status: activityStatusEnum("status").default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("activities_user_id_idx").on(table.userId),
    index("activities_status_idx").on(table.status),
  ]
);

// Activity-Items junction (with composite primary key)
export const activityItems = pgTable(
  "activity_items",
  {
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.itemId] }),
    index("activity_items_item_idx").on(table.itemId),
  ]
);

// Item Attachments
export const itemAttachments = pgTable(
  "item_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    data: text("data").notNull(), // base64 encoded
    sizeBytes: integer("size_bytes").notNull(),
    r2Key: text("r2_key"), // nullable - future R2 migration path
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("attachments_item_id_idx").on(table.itemId)]
);

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "warranty_expiration",
  "maintenance_due",
  "custom_reminder",
]);

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").references(() => items.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    triggerDate: timestamp("trigger_date").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.isRead),
    uniqueIndex("notifications_item_type_date_idx").on(
      table.itemId,
      table.type,
      table.triggerDate
    ),
  ]
);

// Notification Preferences (stored on users table for simplicity)
export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  warrantyReminderDays: integer("warranty_reminder_days").default(30).notNull(),
  maintenanceReminderDays: integer("maintenance_reminder_days")
    .default(7)
    .notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
export type NewItemAttachment = typeof itemAttachments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;

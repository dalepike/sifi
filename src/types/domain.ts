/**
 * Domain types for SiFi Inventory Tracker
 * These are the core business types used throughout the application.
 */

// Base types with timestamps
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// User
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface NewUser {
  id?: string;
  email: string;
  name?: string | null;
}

// Location types
export type LocationType = "home" | "office" | "vehicle" | "storage" | "other";

// Location (recursive hierarchy)
export interface Location extends Timestamps {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  code: string; // 2-letter prefix (e.g., "GA")
  icon: string | null; // Emoji icon
  locationType: LocationType | null; // Type for root locations
}

export interface NewLocation {
  id?: string;
  userId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  code: string;
  icon?: string | null;
  locationType?: LocationType | null;
}

export interface LocationWithPath extends Location {
  path: Location[]; // Ancestors from root to this location
  depth: number;
}

// Item (containers and objects)
export type ItemType = "container" | "object";

// Base item type
interface BaseItem extends Timestamps {
  id: string; // UUID for QR code
  userId: string;
  type: ItemType;
  name: string;
  description: string | null;
  photos: string | null; // JSON array of base64 strings or URLs
  // Warranty and maintenance fields for notifications
  warrantyExpiresAt: string | null;
  maintenanceIntervalDays: number | null;
  lastMaintenanceAt: string | null;
}

// Item must have exactly one parent (location or item)
export type Item =
  | (BaseItem & { parentLocationId: string; parentItemId: null })
  | (BaseItem & { parentLocationId: null; parentItemId: string });

export interface NewItem {
  id?: string;
  userId: string;
  type: ItemType;
  name: string;
  description?: string | null;
  parentLocationId?: string | null;
  parentItemId?: string | null;
  photos?: string | null;
  warrantyExpiresAt?: string | null;
  maintenanceIntervalDays?: number | null;
  lastMaintenanceAt?: string | null;
}

export type ItemWithLocation = Item & {
  locationPath: Location[];
  containerPath: Item[]; // Parent containers (not including the item itself)
  humanReadableCode: string;
};

// Type guards for items
export function isContainer(item: Item): item is Item & { type: "container" } {
  return item.type === "container";
}

export function isObject(item: Item): item is Item & { type: "object" } {
  return item.type === "object";
}

export function hasLocationParent(
  item: Item
): item is Item & { parentLocationId: string; parentItemId: null } {
  return item.parentLocationId !== null;
}

export function hasItemParent(
  item: Item
): item is Item & { parentLocationId: null; parentItemId: string } {
  return item.parentItemId !== null;
}

// Tag (renamed from Category in application layer - DB table is still 'categories')
export interface Tag {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string; // Hex color
  createdAt: string;
}

export interface NewTag {
  id?: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
}

export interface TagWithItemCount extends Tag {
  itemCount: number;
}

// Item-Tag relationship
export interface ItemTag {
  itemId: string;
  tagId: string;
  createdAt: string;
}

// Activity (hobbies/crafts - items belong to activities)
export type ActivityStatus = "active" | "archived";

export interface Activity extends Timestamps {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: ActivityStatus;
}

export interface NewActivity {
  id?: string;
  userId: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  status?: ActivityStatus;
}

export interface ActivityWithItemCount extends Activity {
  itemCount: number;
}

export interface ActivityWithItems extends Activity {
  items: ItemWithLocation[];
}

// Activity-Item relationship
export interface ActivityItem {
  activityId: string;
  itemId: string;
  createdAt: string;
}

// Item Attachment (files attached to items)
export interface Attachment extends Timestamps {
  id: string;
  itemId: string;
  userId: string;
  title: string;
  filename: string;
  mimeType: string;
  data: string; // Base64 encoded file content
  sizeBytes: number;
  sortOrder: number;
}

export interface NewAttachment {
  itemId: string;
  userId: string;
  title: string;
  filename: string;
  mimeType: string;
  data: string;
  sizeBytes: number;
}

// For list display (without file data to reduce payload)
export interface AttachmentMeta {
  id: string;
  itemId: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
}

// Notification types
export type NotificationType =
  | "warranty_expiration"
  | "maintenance_due"
  | "custom_reminder";

// Recurrence types - discriminated union for type safety
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceConfig =
  | { type: "one-time" }
  | { type: "recurring"; frequency: RecurrenceFrequency; endDate: string | null };

// Type guard for recurring notifications
export function isRecurringConfig(
  config: RecurrenceConfig
): config is Extract<RecurrenceConfig, { type: "recurring" }> {
  return config.type === "recurring";
}

// Helper to check if notification is user-created (custom reminder)
export function isCustomReminder(notification: Notification): boolean {
  return notification.type === "custom_reminder";
}

export interface Notification {
  id: string;
  userId: string;
  itemId: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  triggerDate: string;
  isRead: boolean;
  // Recurrence fields
  recurrenceType: string;
  recurrenceEndDate: string | null;
  createdAt: string;
}

export interface NewNotification {
  userId: string;
  itemId?: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  triggerDate: string;
  recurrenceType?: string;
  recurrenceEndDate?: string | null;
}

// For reminder form - input type with discriminated union
export interface ReminderFormData {
  itemId: string;
  title: string;
  message?: string;
  triggerDate: string;
  recurrence: RecurrenceConfig;
}

export interface NotificationWithItem extends Notification {
  item: {
    id: string;
    name: string;
  } | null;
}

export interface NotificationPreferences {
  userId: string;
  warrantyReminderDays: number;
  maintenanceReminderDays: number;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

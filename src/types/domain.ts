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

// Location (recursive hierarchy)
export interface Location extends Timestamps {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  code: string; // 2-letter prefix (e.g., "GA")
}

export interface NewLocation {
  id?: string;
  userId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  code: string;
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

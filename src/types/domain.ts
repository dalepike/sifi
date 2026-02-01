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

// Category
export interface Category {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string; // Hex color
  createdAt: string;
}

export interface NewCategory {
  id?: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
}

// Activity (project)
export type ActivityStatus = "active" | "archived";

export interface Activity extends Timestamps {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  status: ActivityStatus;
}

export interface NewActivity {
  id?: string;
  userId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  status?: ActivityStatus;
}

export interface ActivityWithCategory extends Activity {
  category: Category | null;
}

export interface ActivityWithItems extends ActivityWithCategory {
  items: ItemWithLocation[];
}

// Activity-Item relationship
export interface ActivityItem {
  activityId: string;
  itemId: string;
  createdAt: string;
}

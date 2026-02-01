import { v4 as uuid } from "uuid";
import { getDb, toCamelCase } from "./client";
import { getLocationById, getLocationPath } from "./locations";
import type { Item, NewItem, ItemWithLocation, Location } from "@/types/domain";

/**
 * Item database operations
 */

export function createItem(data: NewItem): Item {
  const db = getDb();
  const id = data.id || uuid();
  const now = new Date().toISOString();

  // Validate XOR constraint
  const hasLocationParent = !!data.parentLocationId;
  const hasItemParent = !!data.parentItemId;

  if (hasLocationParent === hasItemParent) {
    throw new Error("Item must have exactly one parent (location or item)");
  }

  const stmt = db.prepare(`
    INSERT INTO items (id, user_id, type, name, description, parent_location_id, parent_item_id, photos, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId,
    data.type,
    data.name,
    data.description || null,
    data.parentLocationId || null,
    data.parentItemId || null,
    data.photos || null,
    now,
    now
  );

  return getItemById(id, data.userId)!;
}

export function getItemById(id: string, userId: string): Item | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM items WHERE id = ? AND user_id = ?
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Item>(row) : undefined;
}

export function getItemsByLocationId(
  locationId: string,
  userId: string
): Item[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM items WHERE parent_location_id = ? AND user_id = ? ORDER BY type DESC, name
  `);

  const rows = stmt.all(locationId, userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Item>(row));
}

export function getItemsByParentItemId(
  parentItemId: string,
  userId: string
): Item[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM items WHERE parent_item_id = ? AND user_id = ? ORDER BY type DESC, name
  `);

  const rows = stmt.all(parentItemId, userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Item>(row));
}

export function updateItem(
  id: string,
  userId: string,
  data: Partial<Omit<NewItem, "userId">>
): Item | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description);
  }
  if (data.type !== undefined) {
    updates.push("type = ?");
    values.push(data.type);
  }
  if (data.photos !== undefined) {
    updates.push("photos = ?");
    values.push(data.photos);
  }

  // Handle parent changes (must maintain XOR constraint)
  if (data.parentLocationId !== undefined || data.parentItemId !== undefined) {
    const newLocationParent = data.parentLocationId ?? null;
    const newItemParent = data.parentItemId ?? null;

    if ((newLocationParent !== null) === (newItemParent !== null)) {
      throw new Error("Item must have exactly one parent (location or item)");
    }

    updates.push("parent_location_id = ?");
    values.push(newLocationParent);
    updates.push("parent_item_id = ?");
    values.push(newItemParent);
  }

  if (updates.length === 0) {
    return getItemById(id, userId);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE items SET ${updates.join(", ")} WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  return getItemById(id, userId);
}

export function deleteItem(id: string, userId: string): boolean {
  const db = getDb();

  // Check for child items (only containers can have children)
  const childStmt = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE parent_item_id = ? AND user_id = ?
  `);
  const childResult = childStmt.get(id, userId) as { count: number };

  if (childResult.count > 0) {
    throw new Error(
      `Cannot delete item: has ${childResult.count} child item(s)`
    );
  }

  const stmt = db.prepare(`
    DELETE FROM items WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function getItemChildCount(id: string, userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE parent_item_id = ? AND user_id = ?
  `);
  const result = stmt.get(id, userId) as { count: number };
  return result.count;
}

export function getItemCountByLocation(
  locationId: string,
  userId: string
): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE parent_location_id = ? AND user_id = ?
  `);
  const result = stmt.get(locationId, userId) as { count: number };
  return result.count;
}

/**
 * Get the full path to an item, including location ancestors and item ancestors
 */
export function getItemPath(
  id: string,
  userId: string
): { locations: Location[]; items: Item[] } | undefined {
  const item = getItemById(id, userId);
  if (!item) return undefined;

  const items: Item[] = [item];
  let current: Item | undefined = item;

  // Walk up item hierarchy
  while (current && current.parentItemId) {
    const parent = getItemById(current.parentItemId, userId);
    if (parent) {
      items.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  // Get location path from the root item's parent location
  const rootItem = items[0]!; // Safe: we always have at least one item
  let locations: Location[] = [];

  if (rootItem.parentLocationId) {
    locations = getLocationPath(rootItem.parentLocationId, userId);
  }

  return { locations, items };
}

/**
 * Generate human-readable code for an item based on its location path
 */
export function getItemHumanReadableCode(
  id: string,
  userId: string
): string | undefined {
  const path = getItemPath(id, userId);
  if (!path) return undefined;

  const locationCodes = path.locations.map((loc) => loc.code).join("-");
  const item = path.items[path.items.length - 1]!; // Safe: path always has at least the item

  // Use first 8 chars of UUID for the item identifier
  const itemShortId = item.id.substring(0, 8).toUpperCase();

  return locationCodes ? `${locationCodes}-${itemShortId}` : itemShortId;
}

export function getItemWithLocation(
  id: string,
  userId: string
): ItemWithLocation | undefined {
  const item = getItemById(id, userId);
  if (!item) return undefined;

  const path = getItemPath(id, userId);
  if (!path) return undefined;

  const humanReadableCode = getItemHumanReadableCode(id, userId) || id;

  return {
    ...item,
    locationPath: path.locations,
    humanReadableCode,
  };
}

/**
 * Search items by name
 */
export function searchItems(
  query: string,
  userId: string,
  limit = 20
): Item[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM items
    WHERE user_id = ? AND name LIKE ?
    ORDER BY name
    LIMIT ?
  `);

  const rows = stmt.all(userId, `%${query}%`, limit) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Item>(row));
}

/**
 * Move an item to a new parent (location or item)
 */
export function moveItem(
  id: string,
  userId: string,
  newParent: { locationId: string } | { itemId: string }
): Item | undefined {
  const item = getItemById(id, userId);
  if (!item) return undefined;

  // Validate new parent exists
  if ("locationId" in newParent) {
    const location = getLocationById(newParent.locationId, userId);
    if (!location) {
      throw new Error("Target location not found");
    }
    return updateItem(id, userId, {
      parentLocationId: newParent.locationId,
      parentItemId: null,
    });
  } else {
    const parentItem = getItemById(newParent.itemId, userId);
    if (!parentItem) {
      throw new Error("Target container not found");
    }
    if (parentItem.type !== "container") {
      throw new Error("Can only move items into containers");
    }
    // Prevent circular reference
    if (newParent.itemId === id) {
      throw new Error("Cannot move item into itself");
    }
    // Check if moving into a descendant
    const path = getItemPath(newParent.itemId, userId);
    if (path?.items.some((i) => i.id === id)) {
      throw new Error("Cannot move item into its own descendant");
    }
    return updateItem(id, userId, {
      parentLocationId: null,
      parentItemId: newParent.itemId,
    });
  }
}

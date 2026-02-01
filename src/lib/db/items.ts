import { eq, and, sql, ilike, or, desc, asc } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { items, locations } from "./schema";
import { getLocationById, getLocationPath } from "./locations";
import type { Item, NewItem, ItemWithLocation, Location } from "@/types/domain";

// Convert Drizzle item to domain Item type
function toDomainItem(row: typeof items.$inferSelect): Item {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    name: row.name,
    description: row.description,
    parentLocationId: row.parentLocationId,
    parentItemId: row.parentItemId,
    photos: row.photos,
    createdAt: formatDateRequired(row.createdAt),
    updatedAt: formatDateRequired(row.updatedAt),
  } as Item;
}

export async function createItem(data: NewItem): Promise<Item> {
  // Validate XOR constraint
  const hasLocationParent = !!data.parentLocationId;
  const hasItemParent = !!data.parentItemId;

  if (hasLocationParent === hasItemParent) {
    throw new Error("Item must have exactly one parent (location or item)");
  }

  const [row] = await db
    .insert(items)
    .values({
      id: data.id,
      userId: data.userId,
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      parentLocationId: data.parentLocationId ?? null,
      parentItemId: data.parentItemId ?? null,
      photos: data.photos ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create item");
  }

  return toDomainItem(row);
}

export async function getItemById(
  id: string,
  userId: string
): Promise<Item | undefined> {
  const [row] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);

  return row ? toDomainItem(row) : undefined;
}

export async function getItemsByLocationId(
  locationId: string,
  userId: string
): Promise<Item[]> {
  const rows = await db
    .select()
    .from(items)
    .where(
      and(eq(items.parentLocationId, locationId), eq(items.userId, userId))
    )
    .orderBy(desc(items.type), asc(items.name));

  return rows.map(toDomainItem);
}

export async function getItemsByParentItemId(
  parentItemId: string,
  userId: string
): Promise<Item[]> {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.parentItemId, parentItemId), eq(items.userId, userId)))
    .orderBy(desc(items.type), asc(items.name));

  return rows.map(toDomainItem);
}

export async function updateItem(
  id: string,
  userId: string,
  data: Partial<Omit<NewItem, "userId">>
): Promise<Item | undefined> {
  const updateData: Partial<typeof items.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.type !== undefined) {
    updateData.type = data.type;
  }
  if (data.photos !== undefined) {
    updateData.photos = data.photos;
  }

  // Handle parent changes (must maintain XOR constraint)
  if (data.parentLocationId !== undefined || data.parentItemId !== undefined) {
    const newLocationParent = data.parentLocationId ?? null;
    const newItemParent = data.parentItemId ?? null;

    if ((newLocationParent !== null) === (newItemParent !== null)) {
      throw new Error("Item must have exactly one parent (location or item)");
    }

    updateData.parentLocationId = newLocationParent;
    updateData.parentItemId = newItemParent;
  }

  const [row] = await db
    .update(items)
    .set(updateData)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .returning();

  return row ? toDomainItem(row) : undefined;
}

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  // Check for child items (only containers can have children)
  const [childResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.parentItemId, id), eq(items.userId, userId)));

  const childCount = Number(childResult?.count ?? 0);
  if (childCount > 0) {
    throw new Error(
      `Cannot delete item: has ${childCount} child item(s)`
    );
  }

  const result = await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .returning();

  return result.length > 0;
}

export async function getItemChildCount(
  id: string,
  userId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.parentItemId, id), eq(items.userId, userId)));

  return Number(result?.count ?? 0);
}

export async function getItemCountByLocation(
  locationId: string,
  userId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.parentLocationId, locationId), eq(items.userId, userId)));

  return Number(result?.count ?? 0);
}

/**
 * Get the full path to an item, including location ancestors and item ancestors
 */
export async function getItemPath(
  id: string,
  userId: string
): Promise<{ locations: Location[]; items: Item[] } | undefined> {
  const item = await getItemById(id, userId);
  if (!item) return undefined;

  // Use recursive CTE to get all item ancestors
  const result = await db.execute(sql`
    WITH RECURSIVE item_path AS (
      SELECT * FROM items WHERE id = ${id} AND user_id = ${userId}
      UNION ALL
      SELECT i.* FROM items i
      INNER JOIN item_path ip ON i.id = ip.parent_item_id
    )
    SELECT * FROM item_path
  `);

  // Convert rows to Items (reverse to get root-to-leaf order)
  const itemRows = (result.rows as any[]).reverse();
  const itemPath: Item[] = itemRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    description: row.description,
    parentLocationId: row.parent_location_id,
    parentItemId: row.parent_item_id,
    photos: row.photos,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  })) as Item[];

  // Get location path from the root item's parent location
  const rootItem = itemPath[0];
  let locationPath: Location[] = [];

  if (rootItem?.parentLocationId) {
    locationPath = await getLocationPath(rootItem.parentLocationId, userId);
  }

  return { locations: locationPath, items: itemPath };
}

/**
 * Generate human-readable code for an item based on its location path
 */
export async function getItemHumanReadableCode(
  id: string,
  userId: string
): Promise<string | undefined> {
  const path = await getItemPath(id, userId);
  if (!path) return undefined;

  const locationCodes = path.locations.map((loc) => loc.code).join("-");
  const item = path.items[path.items.length - 1];

  // Use first 8 chars of UUID for the item identifier
  const itemShortId = item?.id.substring(0, 8).toUpperCase() ?? "";

  return locationCodes ? `${locationCodes}-${itemShortId}` : itemShortId;
}

export async function getItemWithLocation(
  id: string,
  userId: string
): Promise<ItemWithLocation | undefined> {
  const item = await getItemById(id, userId);
  if (!item) return undefined;

  const path = await getItemPath(id, userId);
  if (!path) return undefined;

  const humanReadableCode =
    (await getItemHumanReadableCode(id, userId)) || id;

  // Container path is all parent items except the item itself
  const containerPath = path.items.slice(0, -1);

  return {
    ...item,
    locationPath: path.locations,
    containerPath,
    humanReadableCode,
  };
}

/**
 * Search items by name and description
 */
export async function searchItems(
  query: string,
  userId: string,
  limit = 50
): Promise<ItemWithLocation[]> {
  const searchTerm = `%${query}%`;

  const rows = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        or(ilike(items.name, searchTerm), ilike(items.description, searchTerm))
      )
    )
    .orderBy(
      sql`CASE WHEN ${items.name} ILIKE ${searchTerm} THEN 0 ELSE 1 END`,
      items.name
    )
    .limit(limit);

  // Get full item details with location for each result
  const results: ItemWithLocation[] = [];
  for (const row of rows) {
    const itemWithLocation = await getItemWithLocation(row.id, userId);
    if (itemWithLocation) {
      results.push(itemWithLocation);
    }
  }

  return results;
}

/**
 * Get all containers for a user
 */
export async function getContainers(userId: string): Promise<ItemWithLocation[]> {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.type, "container")))
    .orderBy(items.name);

  // Get full details with location for each container
  const results: ItemWithLocation[] = [];
  for (const row of rows) {
    const itemWithLocation = await getItemWithLocation(row.id, userId);
    if (itemWithLocation) {
      results.push(itemWithLocation);
    }
  }

  return results;
}

/**
 * Move an item to a new parent (location or item)
 */
export async function moveItem(
  id: string,
  userId: string,
  newParent: { locationId: string } | { itemId: string }
): Promise<Item | undefined> {
  const item = await getItemById(id, userId);
  if (!item) return undefined;

  // Validate new parent exists
  if ("locationId" in newParent) {
    const location = await getLocationById(newParent.locationId, userId);
    if (!location) {
      throw new Error("Target location not found");
    }
    return updateItem(id, userId, {
      parentLocationId: newParent.locationId,
      parentItemId: null,
    });
  } else {
    const parentItem = await getItemById(newParent.itemId, userId);
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
    const path = await getItemPath(newParent.itemId, userId);
    if (path?.items.some((i) => i.id === id)) {
      throw new Error("Cannot move item into its own descendant");
    }
    return updateItem(id, userId, {
      parentLocationId: null,
      parentItemId: newParent.itemId,
    });
  }
}

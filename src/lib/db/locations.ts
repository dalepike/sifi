import { eq, and, isNull, ne, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { locations, items } from "./schema";
import type { Location, NewLocation, LocationWithPath } from "@/types/domain";

// Convert Drizzle location to domain Location type
function toDomainLocation(row: typeof locations.$inferSelect): Location {
  return {
    id: row.id,
    userId: row.userId,
    parentId: row.parentId,
    name: row.name,
    description: row.description,
    code: row.code,
    icon: row.icon,
    locationType: row.locationType,
    createdAt: formatDateRequired(row.createdAt),
    updatedAt: formatDateRequired(row.updatedAt),
  };
}

export async function createLocation(data: NewLocation): Promise<Location> {
  const [row] = await db
    .insert(locations)
    .values({
      id: data.id,
      userId: data.userId,
      parentId: data.parentId ?? null,
      name: data.name,
      description: data.description ?? null,
      code: data.code.toUpperCase(),
      icon: data.icon ?? null,
      locationType: data.locationType ?? null,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create location");
  }

  return toDomainLocation(row);
}

export async function getLocationById(
  id: string,
  userId: string
): Promise<Location | undefined> {
  const [row] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .limit(1);

  return row ? toDomainLocation(row) : undefined;
}

export async function getLocationsByUserId(
  userId: string
): Promise<Location[]> {
  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(locations.name);

  return rows.map(toDomainLocation);
}

export async function getChildLocations(
  parentId: string | null,
  userId: string
): Promise<Location[]> {
  const condition =
    parentId === null
      ? and(eq(locations.userId, userId), isNull(locations.parentId))
      : and(eq(locations.userId, userId), eq(locations.parentId, parentId));

  const rows = await db
    .select()
    .from(locations)
    .where(condition)
    .orderBy(locations.name);

  return rows.map(toDomainLocation);
}

export async function updateLocation(
  id: string,
  userId: string,
  data: Partial<NewLocation>
): Promise<Location | undefined> {
  const updateData: Partial<typeof locations.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.parentId !== undefined) {
    updateData.parentId = data.parentId;
  }
  if (data.code !== undefined) {
    updateData.code = data.code.toUpperCase();
  }
  if (data.icon !== undefined) {
    updateData.icon = data.icon;
  }
  if (data.locationType !== undefined) {
    updateData.locationType = data.locationType;
  }

  const [row] = await db
    .update(locations)
    .set(updateData)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .returning();

  return row ? toDomainLocation(row) : undefined;
}

export async function deleteLocation(
  id: string,
  userId: string
): Promise<boolean> {
  // Check for child locations
  const [childLocationResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locations)
    .where(and(eq(locations.parentId, id), eq(locations.userId, userId)));

  const childLocationCount = Number(childLocationResult?.count ?? 0);
  if (childLocationCount > 0) {
    throw new Error(
      `Cannot delete location: has ${childLocationCount} child location(s)`
    );
  }

  // Check for child items
  const [childItemResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.parentLocationId, id), eq(items.userId, userId)));

  const childItemCount = Number(childItemResult?.count ?? 0);
  if (childItemCount > 0) {
    throw new Error(
      `Cannot delete location: has ${childItemCount} item(s)`
    );
  }

  const result = await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .returning();

  return result.length > 0;
}

export async function isCodeUnique(
  code: string,
  userId: string,
  excludeId?: string
): Promise<boolean> {
  const normalizedCode = code.toUpperCase();

  const conditions = excludeId
    ? and(
        eq(locations.userId, userId),
        eq(locations.code, normalizedCode),
        ne(locations.id, excludeId)
      )
    : and(eq(locations.userId, userId), eq(locations.code, normalizedCode));

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locations)
    .where(conditions);

  return Number(result?.count ?? 0) === 0;
}

// Recursive path query using PostgreSQL CTE
export async function getLocationPath(
  id: string,
  userId: string
): Promise<Location[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE path AS (
      SELECT * FROM locations WHERE id = ${id} AND user_id = ${userId}
      UNION ALL
      SELECT l.* FROM locations l
      INNER JOIN path p ON l.id = p.parent_id
    )
    SELECT * FROM path
  `);

  // Reverse to get root-to-leaf order, then convert to domain type
  const rows = (result.rows as any[]).reverse();
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    code: row.code,
    icon: row.icon,
    locationType: row.location_type,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  }));
}

export async function getLocationWithPath(
  id: string,
  userId: string
): Promise<LocationWithPath | undefined> {
  const location = await getLocationById(id, userId);
  if (!location) return undefined;

  const path = await getLocationPath(id, userId);
  return {
    ...location,
    path,
    depth: path.length - 1,
  };
}

export async function getLocationChildCounts(
  id: string,
  userId: string
): Promise<{ locations: number; items: number }> {
  const [locationResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locations)
    .where(and(eq(locations.parentId, id), eq(locations.userId, userId)));

  const [itemResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.parentLocationId, id), eq(items.userId, userId)));

  return {
    locations: Number(locationResult?.count ?? 0),
    items: Number(itemResult?.count ?? 0),
  };
}

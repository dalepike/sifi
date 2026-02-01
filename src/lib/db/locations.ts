import { v4 as uuid } from "uuid";
import { getDb, toCamelCase } from "./client";
import type { Location, NewLocation, LocationWithPath } from "@/types/domain";

/**
 * Location database operations
 */

export function createLocation(data: NewLocation): Location {
  const db = getDb();
  const id = data.id || uuid();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO locations (id, user_id, parent_id, name, description, code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId,
    data.parentId || null,
    data.name,
    data.description || null,
    data.code.toUpperCase(),
    now,
    now
  );

  return getLocationById(id, data.userId)!;
}

export function getLocationById(
  id: string,
  userId: string
): Location | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM locations WHERE id = ? AND user_id = ?
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Location>(row) : undefined;
}

export function getLocationsByUserId(userId: string): Location[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM locations WHERE user_id = ? ORDER BY name
  `);

  const rows = stmt.all(userId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Location>(row));
}

export function getChildLocations(
  parentId: string | null,
  userId: string
): Location[] {
  const db = getDb();

  if (parentId === null) {
    const stmt = db.prepare(`
      SELECT * FROM locations WHERE user_id = ? AND parent_id IS NULL ORDER BY name
    `);
    const rows = stmt.all(userId) as Record<string, unknown>[];
    return rows.map((row) => toCamelCase<Location>(row));
  }

  const stmt = db.prepare(`
    SELECT * FROM locations WHERE user_id = ? AND parent_id = ? ORDER BY name
  `);
  const rows = stmt.all(userId, parentId) as Record<string, unknown>[];
  return rows.map((row) => toCamelCase<Location>(row));
}

export function updateLocation(
  id: string,
  userId: string,
  data: Partial<NewLocation>
): Location | undefined {
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
  if (data.parentId !== undefined) {
    updates.push("parent_id = ?");
    values.push(data.parentId);
  }
  if (data.code !== undefined) {
    updates.push("code = ?");
    values.push(data.code.toUpperCase());
  }

  if (updates.length === 0) {
    return getLocationById(id, userId);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE locations SET ${updates.join(", ")} WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  return getLocationById(id, userId);
}

export function deleteLocation(id: string, userId: string): boolean {
  const db = getDb();

  // Check for child locations
  const childLocationStmt = db.prepare(`
    SELECT COUNT(*) as count FROM locations WHERE parent_id = ? AND user_id = ?
  `);
  const childLocationResult = childLocationStmt.get(id, userId) as {
    count: number;
  };

  if (childLocationResult.count > 0) {
    throw new Error(
      `Cannot delete location: has ${childLocationResult.count} child location(s)`
    );
  }

  // Check for child items
  const childItemStmt = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE parent_location_id = ? AND user_id = ?
  `);
  const childItemResult = childItemStmt.get(id, userId) as { count: number };

  if (childItemResult.count > 0) {
    throw new Error(
      `Cannot delete location: has ${childItemResult.count} item(s)`
    );
  }

  const stmt = db.prepare(`
    DELETE FROM locations WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function isCodeUnique(
  code: string,
  userId: string,
  excludeId?: string
): boolean {
  const db = getDb();

  if (excludeId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM locations
      WHERE user_id = ? AND code = ? AND id != ?
    `);
    const result = stmt.get(userId, code.toUpperCase(), excludeId) as {
      count: number;
    };
    return result.count === 0;
  }

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM locations WHERE user_id = ? AND code = ?
  `);
  const result = stmt.get(userId, code.toUpperCase()) as { count: number };
  return result.count === 0;
}

export function getLocationPath(id: string, userId: string): Location[] {
  const path: Location[] = [];
  let current = getLocationById(id, userId);

  while (current) {
    path.unshift(current);
    if (current.parentId) {
      current = getLocationById(current.parentId, userId);
    } else {
      break;
    }
  }

  return path;
}

export function getLocationWithPath(
  id: string,
  userId: string
): LocationWithPath | undefined {
  const location = getLocationById(id, userId);
  if (!location) return undefined;

  const path = getLocationPath(id, userId);
  return {
    ...location,
    path,
    depth: path.length - 1,
  };
}

export function getLocationChildCounts(
  id: string,
  userId: string
): { locations: number; items: number } {
  const db = getDb();

  const locationStmt = db.prepare(`
    SELECT COUNT(*) as count FROM locations WHERE parent_id = ? AND user_id = ?
  `);
  const locationResult = locationStmt.get(id, userId) as { count: number };

  const itemStmt = db.prepare(`
    SELECT COUNT(*) as count FROM items WHERE parent_location_id = ? AND user_id = ?
  `);
  const itemResult = itemStmt.get(id, userId) as { count: number };

  return {
    locations: locationResult.count,
    items: itemResult.count,
  };
}

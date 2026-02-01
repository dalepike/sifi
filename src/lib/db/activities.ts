import { v4 as uuid } from "uuid";
import { getDb, toCamelCase } from "./client";
import type { Activity, NewActivity } from "@/types/domain";

/**
 * Activity database operations
 * Activities represent hobbies/crafts (e.g., pottery, sewing, woodworking)
 */

export function createActivity(data: NewActivity): Activity {
  const db = getDb();
  const id = data.id || uuid();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO activities (id, user_id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.userId,
    data.name,
    data.description || null,
    data.status || "active",
    now,
    now
  );

  return getActivityById(id, data.userId)!;
}

export function getActivityById(
  id: string,
  userId: string
): Activity | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM activities WHERE id = ? AND user_id = ?
  `);

  const row = stmt.get(id, userId) as Record<string, unknown> | undefined;
  return row ? toCamelCase<Activity>(row) : undefined;
}

export function getActivitiesByUserId(
  userId: string,
  status?: "active" | "archived"
): Activity[] {
  const db = getDb();

  let query = `
    SELECT * FROM activities WHERE user_id = ?
  `;

  const params: unknown[] = [userId];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY name";

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];

  return rows.map((row) => toCamelCase<Activity>(row));
}

export function updateActivity(
  id: string,
  userId: string,
  data: Partial<NewActivity>
): Activity | undefined {
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
  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }

  if (updates.length === 0) {
    return getActivityById(id, userId);
  }

  updates.push("updated_at = ?");
  values.push(now);
  values.push(id);
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE activities SET ${updates.join(", ")} WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  return getActivityById(id, userId);
}

export function deleteActivity(id: string, userId: string): boolean {
  const db = getDb();

  // Activity-item relationships will be cascade deleted
  const stmt = db.prepare(`
    DELETE FROM activities WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function getActivityItemCount(id: string, userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM activity_items ai
    JOIN activities a ON ai.activity_id = a.id
    WHERE ai.activity_id = ? AND a.user_id = ?
  `);
  const result = stmt.get(id, userId) as { count: number };
  return result.count;
}

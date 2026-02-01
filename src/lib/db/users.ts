import { v4 as uuid } from "uuid";
import { getDb, toCamelCase } from "./client";
import type { User, NewUser } from "@/types/domain";

// For password hashing, we'll use a simple approach
// In production, use bcrypt or argon2
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function createUser(
  data: NewUser & { password: string }
): Omit<User, "passwordHash"> {
  const db = getDb();
  const id = data.id || uuid();
  const now = new Date().toISOString();
  const passwordHash = hashPassword(data.password);

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.email.toLowerCase(), data.name || null, passwordHash, now);

  return getUserById(id)!;
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, email, name, created_at FROM users WHERE id = ?
  `);

  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? toCamelCase<User>(row) : undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, email, name, created_at FROM users WHERE email = ?
  `);

  const row = stmt.get(email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? toCamelCase<User>(row) : undefined;
}

export function getUserWithPasswordHash(
  email: string
): (User & { passwordHash: string }) | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?
  `);

  const row = stmt.get(email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? toCamelCase<User & { passwordHash: string }>(row) : undefined;
}

export function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "email">>
): User | undefined {
  const db = getDb();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.email !== undefined) {
    updates.push("email = ?");
    values.push(data.email.toLowerCase());
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE users SET ${updates.join(", ")} WHERE id = ?
  `);
  stmt.run(...values);

  return getUserById(id);
}

export function deleteUser(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function isEmailUnique(email: string, excludeId?: string): boolean {
  const db = getDb();

  if (excludeId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?
    `);
    const result = stmt.get(email.toLowerCase(), excludeId) as {
      count: number;
    };
    return result.count === 0;
  }

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE email = ?
  `);
  const result = stmt.get(email.toLowerCase()) as { count: number };
  return result.count === 0;
}

import { eq, and, ne, sql } from "drizzle-orm";
import { db, formatDateRequired } from "./drizzle-client";
import { users } from "./schema";
import type { User, NewUser } from "@/types/domain";
import { createHash } from "crypto";

// Password hashing (TODO: migrate to bcrypt for production)
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Convert Drizzle user to domain User type
function toDomainUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: formatDateRequired(row.createdAt),
  };
}

export async function createUser(
  data: NewUser & { password: string }
): Promise<User> {
  const passwordHash = hashPassword(data.password);

  const [row] = await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email.toLowerCase(),
      name: data.name ?? null,
      passwordHash,
    })
    .returning();

  if (!row) {
    throw new Error("Failed to create user");
  }

  return toDomainUser(row);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row ? toDomainUser(row as typeof users.$inferSelect) : undefined;
}

export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return row ? toDomainUser(row as typeof users.$inferSelect) : undefined;
}

export async function getUserWithPasswordHash(
  email: string
): Promise<(User & { passwordHash: string }) | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!row) return undefined;

  return {
    ...toDomainUser(row),
    passwordHash: row.passwordHash,
  };
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "email">>
): Promise<User | undefined> {
  const updateData: Partial<typeof users.$inferInsert> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.email !== undefined) {
    updateData.email = data.email.toLowerCase();
  }

  if (Object.keys(updateData).length === 0) {
    return getUserById(id);
  }

  const [row] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return row ? toDomainUser(row) : undefined;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result.length > 0;
}

export async function isEmailUnique(
  email: string,
  excludeId?: string
): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();

  const conditions = excludeId
    ? and(eq(users.email, normalizedEmail), ne(users.id, excludeId))
    : eq(users.email, normalizedEmail);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(conditions);

  return Number(result?.count ?? 0) === 0;
}

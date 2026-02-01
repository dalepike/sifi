import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Get database URL from environment
// During transition, we support both old DATABASE_PATH and new DATABASE_URL
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return url;
}

// Create connection pool
// Railway internal connections don't use SSL, external ones do
const dbUrl = getDatabaseUrl();
const isInternalRailway = dbUrl.includes(".railway.internal");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isInternalRailway ? false : (process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false),
});

// Log pool errors (don't crash on transient issues)
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("Closing database pool...");
  await pool.end();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;

// Helper to format Date as ISO string (for domain type compatibility)
export function formatDate(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export function formatDateRequired(date: Date): string {
  return date.toISOString();
}

export function formatDateOptional(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined;
}

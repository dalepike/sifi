/**
 * SQLite to PostgreSQL Migration Script
 *
 * Migrates data from the local SQLite database to PostgreSQL.
 *
 * Usage:
 *   1. Back up your SQLite database: cp sifi.db sifi.db.backup
 *   2. Set DATABASE_URL to your PostgreSQL connection string
 *   3. Run: bun run scripts/migrate-data.ts
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

// Validate required environment variable
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

// Mask password in connection string for logging
const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ":****@");

// Open SQLite database (read-only)
const sqlitePath = "./sifi.db";
console.log(`📂 Opening SQLite database: ${sqlitePath}`);

let sqlite: Database.Database;
try {
  sqlite = new Database(sqlitePath, { readonly: true });
} catch (error) {
  console.error(`❌ Failed to open SQLite database: ${error}`);
  process.exit(1);
}

// Connect to PostgreSQL
console.log(`🐘 Connecting to PostgreSQL: ${maskedUrl}`);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

const db = drizzle(pool, { schema });

// Track migration stats
const stats = {
  users: { migrated: 0, errors: 0 },
  locations: { migrated: 0, errors: 0 },
  items: { migrated: 0, errors: 0 },
  tags: { migrated: 0, errors: 0 },
  itemTags: { migrated: 0, errors: 0 },
  activities: { migrated: 0, errors: 0 },
  activityItems: { migrated: 0, errors: 0 },
  attachments: { migrated: 0, errors: 0 },
};

async function migrateUsers() {
  console.log("\n👤 Migrating users...");
  const rows = sqlite.prepare("SELECT * FROM users").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.users)
        .values({
          id: row.id,
          email: row.email,
          name: row.name,
          passwordHash: row.password_hash,
          createdAt: new Date(row.created_at),
        })
        .onConflictDoNothing();
      stats.users.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate user ${row.id}:`, error);
      stats.users.errors++;
    }
  }
  console.log(` Done (${stats.users.migrated} migrated)`);
}

async function migrateLocations() {
  console.log("\n📍 Migrating locations...");
  // Order by created_at to ensure parents are inserted before children
  const rows = sqlite
    .prepare("SELECT * FROM locations ORDER BY created_at")
    .all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.locations)
        .values({
          id: row.id,
          userId: row.user_id,
          parentId: row.parent_id,
          name: row.name,
          description: row.description,
          code: row.code,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        })
        .onConflictDoNothing();
      stats.locations.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate location ${row.id}:`, error);
      stats.locations.errors++;
    }
  }
  console.log(` Done (${stats.locations.migrated} migrated)`);
}

async function migrateItems() {
  console.log("\n📦 Migrating items...");
  // Order by created_at to ensure parent items are inserted before children
  const rows = sqlite
    .prepare("SELECT * FROM items ORDER BY created_at")
    .all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.items)
        .values({
          id: row.id,
          userId: row.user_id,
          type: row.type as "container" | "object",
          name: row.name,
          description: row.description,
          parentLocationId: row.parent_location_id,
          parentItemId: row.parent_item_id,
          photos: row.photos,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        })
        .onConflictDoNothing();
      stats.items.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate item ${row.id}:`, error);
      stats.items.errors++;
    }
  }
  console.log(` Done (${stats.items.migrated} migrated)`);
}

async function migrateTags() {
  console.log("\n🏷️  Migrating tags (from categories table)...");
  const rows = sqlite.prepare("SELECT * FROM categories").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.tags)
        .values({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          color: row.color,
          createdAt: new Date(row.created_at),
        })
        .onConflictDoNothing();
      stats.tags.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate tag ${row.id}:`, error);
      stats.tags.errors++;
    }
  }
  console.log(` Done (${stats.tags.migrated} migrated)`);
}

async function migrateItemTags() {
  console.log("\n🔗 Migrating item_tags...");
  const rows = sqlite.prepare("SELECT * FROM item_tags").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.itemTags)
        .values({
          itemId: row.item_id,
          tagId: row.tag_id,
          createdAt: new Date(row.created_at),
        })
        .onConflictDoNothing();
      stats.itemTags.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate item_tag:`, error);
      stats.itemTags.errors++;
    }
  }
  console.log(` Done (${stats.itemTags.migrated} migrated)`);
}

async function migrateActivities() {
  console.log("\n🎯 Migrating activities...");
  const rows = sqlite.prepare("SELECT * FROM activities").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.activities)
        .values({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          status: (row.status as "active" | "archived") ?? "active",
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        })
        .onConflictDoNothing();
      stats.activities.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate activity ${row.id}:`, error);
      stats.activities.errors++;
    }
  }
  console.log(` Done (${stats.activities.migrated} migrated)`);
}

async function migrateActivityItems() {
  console.log("\n🔗 Migrating activity_items...");
  const rows = sqlite.prepare("SELECT * FROM activity_items").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.activityItems)
        .values({
          activityId: row.activity_id,
          itemId: row.item_id,
          createdAt: new Date(row.created_at),
        })
        .onConflictDoNothing();
      stats.activityItems.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate activity_item:`, error);
      stats.activityItems.errors++;
    }
  }
  console.log(` Done (${stats.activityItems.migrated} migrated)`);
}

async function migrateAttachments() {
  console.log("\n📎 Migrating attachments...");
  const rows = sqlite.prepare("SELECT * FROM item_attachments").all() as any[];

  for (const row of rows) {
    try {
      await db
        .insert(schema.itemAttachments)
        .values({
          id: row.id,
          itemId: row.item_id,
          userId: row.user_id,
          title: row.title,
          filename: row.filename,
          mimeType: row.mime_type,
          data: row.data, // base64 string
          sizeBytes: row.size_bytes,
          r2Key: null, // Future: populate when migrating to R2
          sortOrder: row.sort_order ?? 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        })
        .onConflictDoNothing();
      stats.attachments.migrated++;
      process.stdout.write(".");
    } catch (error) {
      console.error(`\n  ❌ Failed to migrate attachment ${row.id}:`, error);
      stats.attachments.errors++;
    }
  }
  console.log(` Done (${stats.attachments.migrated} migrated)`);
}

async function verify() {
  console.log("\n🔍 Verifying migration...");

  const checks = [
    { name: "users", sqliteTable: "users", pgTable: schema.users },
    { name: "locations", sqliteTable: "locations", pgTable: schema.locations },
    { name: "items", sqliteTable: "items", pgTable: schema.items },
    { name: "tags", sqliteTable: "categories", pgTable: schema.tags },
    { name: "item_tags", sqliteTable: "item_tags", pgTable: schema.itemTags },
    { name: "activities", sqliteTable: "activities", pgTable: schema.activities },
    {
      name: "activity_items",
      sqliteTable: "activity_items",
      pgTable: schema.activityItems,
    },
    {
      name: "attachments",
      sqliteTable: "item_attachments",
      pgTable: schema.itemAttachments,
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const sqliteCount = sqlite
      .prepare(`SELECT COUNT(*) as count FROM ${check.sqliteTable}`)
      .get() as any;
    const [pgResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(check.pgTable);
    const pgCount = Number(pgResult?.count ?? 0);

    const match = sqliteCount.count === pgCount;
    const icon = match ? "✅" : "❌";
    console.log(
      `  ${icon} ${check.name}: SQLite=${sqliteCount.count}, PostgreSQL=${pgCount}`
    );

    if (!match) allPassed = false;
  }

  return allPassed;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          SiFi SQLite → PostgreSQL Migration                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`📂 SQLite: ${sqlitePath}`);
  console.log(`🐘 PostgreSQL: ${maskedUrl}`);

  try {
    // Migrate in order (respecting foreign keys)
    await migrateUsers();
    await migrateLocations();
    await migrateItems();
    await migrateTags();
    await migrateItemTags();
    await migrateActivities();
    await migrateActivityItems();
    await migrateAttachments();

    // Print stats
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    Migration Stats                         ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    for (const [table, counts] of Object.entries(stats)) {
      const status =
        counts.errors > 0 ? `⚠️  ${counts.errors} errors` : "✅ OK";
      console.log(
        `║  ${table.padEnd(15)} ${String(counts.migrated).padStart(5)} migrated  ${status.padEnd(15)} ║`
      );
    }
    console.log("╚════════════════════════════════════════════════════════════╝");

    // Verify
    const verified = await verify();

    if (verified) {
      console.log("\n✅ Migration completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("   1. Test the application thoroughly");
      console.log("   2. Archive the SQLite backup: mv sifi.db.backup archives/");
      console.log("   3. Remove better-sqlite3: bun remove better-sqlite3 @types/better-sqlite3");
    } else {
      console.log("\n⚠️  Migration completed with count mismatches.");
      console.log("   Review errors above before proceeding.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main();

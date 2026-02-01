# feat: Migrate SiFi from SQLite to PostgreSQL + Railway Deployment

---
title: Migrate SiFi from SQLite to PostgreSQL + Railway Deployment
type: feat
date: 2026-02-01
revised: 2026-02-01 (incorporated reviewer feedback)
---

## Overview

Migrate SiFi inventory tracking application from SQLite (better-sqlite3) to PostgreSQL with Drizzle ORM, and deploy on Railway.

**Current State:**
- Next.js 16 with better-sqlite3 (synchronous API)
- 8 tables, ~4MB database file
- File attachments stored as base64 TEXT in database
- NextAuth v5 credentials-based authentication
- Local development only

**Target State:**
- PostgreSQL on Railway with Drizzle ORM (async)
- Production deployment on Railway
- Environment-based configuration (dev/prod)
- Architecture ready for future enhancements (R2 storage, scaling)

## Problem Statement

1. **SQLite limits hosting options** - Most managed platforms don't support persistent SQLite
2. **Concurrent access** - PostgreSQL handles multiple users better than SQLite write locks
3. **Backup/recovery** - Railway provides managed backups
4. **Future-proofing** - PostgreSQL is the standard foundation if needs grow

## Technical Approach

### Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| ORM | **Drizzle** | Lightweight, SQL-like, excellent TypeScript support, schema-as-code |
| PostgreSQL driver | **pg** | Standard, proven, works with Drizzle |
| UUID generation | `gen_random_uuid()` | Built-in PostgreSQL 13+, no extension needed |
| Attachments | **PostgreSQL BYTEA** | Keep in DB for now; R2 migration path documented for future |

### Schema Changes Summary

| SQLite Pattern | PostgreSQL Pattern |
|----------------|-------------------|
| `TEXT` primary keys (UUIDs) | `UUID` type with `defaultRandom()` |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT NOW()` |
| `CHECK(type IN (...))` | PostgreSQL enum type |
| `?` placeholders | `$1, $2` (handled by Drizzle) |
| `base64 TEXT` attachments | `BYTEA` (binary, more efficient) |

---

## Implementation Phases

### Phase 1: Infrastructure & Schema Setup

**Objective:** Provision Railway PostgreSQL, create validated configuration, define Drizzle schema.

**Tasks:**
- [ ] Create Railway project and PostgreSQL service
- [ ] Create validated environment configuration
- [ ] Install dependencies: `bun add drizzle-orm pg zod && bun add -d drizzle-kit @types/pg`
- [ ] Create Drizzle schema with indexes and constraints
- [ ] Add db scripts to package.json
- [ ] Run `drizzle-kit push` to create tables

**Environment Configuration:** `src/lib/config.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

export const env = validateEnv();
```

**Schema File:** `src/lib/db/schema.ts`

```typescript
import {
  pgTable, pgEnum, uuid, text, timestamp, integer,
  index, primaryKey, uniqueIndex
} from 'drizzle-orm/pg-core';

// Enums
export const itemTypeEnum = pgEnum('item_type', ['container', 'object']);
export const activityStatusEnum = pgEnum('activity_status', ['active', 'paused', 'completed', 'archived']);

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
]);

// Locations (hierarchical)
export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references(() => locations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('locations_user_id_idx').on(table.userId),
  index('locations_parent_id_idx').on(table.parentId),
  uniqueIndex('locations_user_code_idx').on(table.userId, table.code),
]);

// Items (containers or objects)
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: itemTypeEnum('type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code'),
  parentLocationId: uuid('parent_location_id').references(() => locations.id, { onDelete: 'set null' }),
  parentItemId: uuid('parent_item_id').references(() => items.id, { onDelete: 'set null' }),
  quantity: integer('quantity').default(1),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('items_user_id_idx').on(table.userId),
  index('items_parent_location_idx').on(table.parentLocationId),
  index('items_parent_item_idx').on(table.parentItemId),
  index('items_type_idx').on(table.type),
  uniqueIndex('items_user_code_idx').on(table.userId, table.code),
]);

// Tags (renamed from categories for clarity)
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('tags_user_id_idx').on(table.userId),
]);

// Item-Tags junction (with composite primary key)
export const itemTags = pgTable('item_tags', {
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.itemId, table.tagId] }),
]);

// Activities
export const activities = pgTable('activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: activityStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('activities_user_id_idx').on(table.userId),
  index('activities_status_idx').on(table.status),
]);

// Activity-Items junction (with composite primary key)
export const activityItems = pgTable('activity_items', {
  activityId: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.activityId, table.itemId] }),
]);

// Attachments (BYTEA for binary storage, with R2 migration path)
// Note: r2Key is nullable - when populated, data should be fetched from R2 instead
export const itemAttachments = pgTable('item_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),  // base64 encoded (matches current SQLite)
  r2Key: text('r2_key'),  // nullable - future R2 migration path
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('attachments_item_id_idx').on(table.itemId),
]);

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ItemAttachment = typeof itemAttachments.$inferSelect;
```

**Drizzle Config:** `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Package.json additions:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**.env.example:**
```bash
# Database (Railway provides this)
DATABASE_URL=postgresql://user:pass@host:5432/sifi?sslmode=require

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-at-least-32-characters-long
NEXTAUTH_URL=http://localhost:3000
```

**Deliverables:**
- Railway project with PostgreSQL provisioned
- Validated environment configuration
- Drizzle schema with proper indexes and constraints
- Database tables created via `drizzle-kit push`

---

### Phase 2: Database Client & Operations Conversion

**Objective:** Replace synchronous better-sqlite3 with async Drizzle client, convert all database operations.

**Tasks:**
- [x] Create new Drizzle client with proper error handling
- [x] Convert `users.ts` (auth-critical, test immediately)
- [x] Convert `locations.ts` with recursive path queries
- [x] Convert `items.ts` with recursive path queries
- [x] Convert `tags.ts`
- [x] Convert `item-tags.ts`
- [x] Convert `activities.ts`
- [x] Convert `activity-items.ts`
- [x] Convert `attachments.ts`
- [x] Update all server actions to await async calls
- [x] Update auth configuration

**Database Client:** `src/lib/db/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config';

// Create connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Railway PostgreSQL has valid SSL certificates
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

// Log pool errors (don't crash on transient issues)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Closing database pool...');
  await pool.end();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;

// Transaction helper for multi-step operations
export async function withTransaction<T>(
  fn: (tx: DbClient) => Promise<T>
): Promise<T> {
  return db.transaction(fn);
}
```

**Example Conversion Pattern - users.ts:**

```typescript
import { db } from './client';
import { users, type User, type NewUser } from './schema';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user;
}

export async function createUser(data: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ ...data, email: data.email.toLowerCase() })
    .returning();
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<NewUser, 'id'>>
): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}
```

**Recursive Path Query (PostgreSQL CTE) - locations.ts:**

```typescript
import { db } from './client';
import { locations, type Location } from './schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schema for validating raw CTE results
const locationRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  code: z.string().nullable(),
  sort_order: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

function rowToLocation(row: z.infer<typeof locationRowSchema>): Location {
  return {
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    code: row.code,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLocationPath(locationId: string): Promise<Location[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE path AS (
      SELECT * FROM locations WHERE id = ${locationId}
      UNION ALL
      SELECT l.* FROM locations l
      INNER JOIN path p ON l.id = p.parent_id
    )
    SELECT * FROM path ORDER BY created_at ASC
  `);

  return result.rows.map((row) => {
    const parsed = locationRowSchema.parse(row);
    return rowToLocation(parsed);
  });
}
```

**Server Action Pattern:**

```typescript
// src/actions/locations.ts
'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createLocation as createLocationDb } from '@/lib/db/locations';
import type { ActionResult } from '@/types/actions';
import type { Location } from '@/lib/db/schema';

export async function createLocation(
  data: LocationFormData
): Promise<ActionResult<Location>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const location = await createLocationDb(data, session.user.id);
    revalidatePath('/locations');
    return { success: true, data: location };
  } catch (error) {
    console.error('Failed to create location:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create location'
    };
  }
}
```

**Auth Configuration Update:** `src/lib/auth.ts`

```typescript
// Key changes: all db calls are now async
authorize: async (credentials) => {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await getUserByEmail(credentials.email);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return { id: user.id, email: user.email, name: user.name };
},

callbacks: {
  async session({ session, token }) {
    if (token.sub) {
      const user = await getUserById(token.sub);
      if (user) {
        session.user.id = user.id;
        session.user.name = user.name;
      }
    }
    return session;
  },
}
```

**Deliverables:**
- All database operations converted to async Drizzle
- Server actions updated with error handling
- Auth working with async database calls
- Each feature tested as converted

---

### Phase 3: Data Migration

**Objective:** Migrate existing SQLite data to PostgreSQL with verification.

**Tasks:**
- [ ] Back up SQLite database file
- [x] Create migration script with proper error handling
- [ ] Run migration
- [ ] Verify data integrity
- [ ] Test application functionality

**Migration Script:** `scripts/migrate-data.ts`

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/lib/db/schema';

// Validate required env
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sqlite = new Database('./sifi.db', { readonly: true });
const pool = new Pool({ connectionString: DATABASE_URL });
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
  console.log('Migrating users...');
  const rows = sqlite.prepare('SELECT * FROM users').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.users).values({
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }).onConflictDoNothing();
      stats.users.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate user ${row.id}:`, error);
      stats.users.errors++;
    }
  }
}

async function migrateLocations() {
  console.log('Migrating locations...');
  const rows = sqlite.prepare('SELECT * FROM locations ORDER BY created_at').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.locations).values({
        id: row.id,
        userId: row.user_id,
        parentId: row.parent_id,
        name: row.name,
        description: row.description,
        code: row.code,
        sortOrder: row.sort_order ?? 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }).onConflictDoNothing();
      stats.locations.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate location ${row.id}:`, error);
      stats.locations.errors++;
    }
  }
}

async function migrateItems() {
  console.log('Migrating items...');
  const rows = sqlite.prepare('SELECT * FROM items ORDER BY created_at').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.items).values({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        name: row.name,
        description: row.description,
        code: row.code,
        parentLocationId: row.parent_location_id,
        parentItemId: row.parent_item_id,
        quantity: row.quantity ?? 1,
        sortOrder: row.sort_order ?? 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }).onConflictDoNothing();
      stats.items.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate item ${row.id}:`, error);
      stats.items.errors++;
    }
  }
}

async function migrateTags() {
  console.log('Migrating tags (from categories table)...');
  const rows = sqlite.prepare('SELECT * FROM categories').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.tags).values({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        color: row.color,
        createdAt: new Date(row.created_at),
      }).onConflictDoNothing();
      stats.tags.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate tag ${row.id}:`, error);
      stats.tags.errors++;
    }
  }
}

async function migrateItemTags() {
  console.log('Migrating item_tags...');
  const rows = sqlite.prepare('SELECT * FROM item_tags').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.itemTags).values({
        itemId: row.item_id,
        tagId: row.tag_id,
      }).onConflictDoNothing();
      stats.itemTags.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate item_tag:`, error);
      stats.itemTags.errors++;
    }
  }
}

async function migrateActivities() {
  console.log('Migrating activities...');
  const rows = sqlite.prepare('SELECT * FROM activities').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.activities).values({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        status: row.status ?? 'active',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }).onConflictDoNothing();
      stats.activities.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate activity ${row.id}:`, error);
      stats.activities.errors++;
    }
  }
}

async function migrateActivityItems() {
  console.log('Migrating activity_items...');
  const rows = sqlite.prepare('SELECT * FROM activity_items').all() as any[];

  for (const row of rows) {
    try {
      await db.insert(schema.activityItems).values({
        activityId: row.activity_id,
        itemId: row.item_id,
      }).onConflictDoNothing();
      stats.activityItems.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate activity_item:`, error);
      stats.activityItems.errors++;
    }
  }
}

async function migrateAttachments() {
  console.log('Migrating attachments...');
  const rows = sqlite.prepare('SELECT * FROM item_attachments').all() as any[];

  for (const row of rows) {
    try {
      // Keep base64 data in PostgreSQL for now
      // r2Key is null - can be populated later during R2 migration
      await db.insert(schema.itemAttachments).values({
        id: row.id,
        itemId: row.item_id,
        data: row.data,  // base64 string
        r2Key: null,  // Future: populate when migrating to R2
        fileName: row.file_name,
        mimeType: row.mime_type,
        fileSize: row.data ? Buffer.from(row.data, 'base64').length : null,
        sortOrder: row.sort_order ?? 0,
        createdAt: new Date(row.created_at),
      }).onConflictDoNothing();
      stats.attachments.migrated++;
    } catch (error) {
      console.error(`  Failed to migrate attachment ${row.id}:`, error);
      stats.attachments.errors++;
    }
  }
}

async function verify() {
  console.log('\nVerifying migration...');

  const checks = [
    { name: 'users', sqlite: 'users', pg: schema.users },
    { name: 'locations', sqlite: 'locations', pg: schema.locations },
    { name: 'items', sqlite: 'items', pg: schema.items },
    { name: 'tags', sqlite: 'categories', pg: schema.tags },
    { name: 'item_tags', sqlite: 'item_tags', pg: schema.itemTags },
    { name: 'activities', sqlite: 'activities', pg: schema.activities },
    { name: 'activity_items', sqlite: 'activity_items', pg: schema.activityItems },
    { name: 'attachments', sqlite: 'item_attachments', pg: schema.itemAttachments },
  ];

  let allPassed = true;

  for (const check of checks) {
    const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as count FROM ${check.sqlite}`).get() as any;
    const [pgResult] = await db.select({ count: sql`count(*)` }).from(check.pg);
    const pgCount = Number(pgResult.count);

    const match = sqliteCount.count === pgCount;
    console.log(`  ${check.name}: SQLite=${sqliteCount.count}, PostgreSQL=${pgCount} ${match ? '✓' : '✗'}`);

    if (!match) allPassed = false;
  }

  return allPassed;
}

async function main() {
  console.log('Starting migration from SQLite to PostgreSQL...\n');
  console.log('SQLite file: ./sifi.db');
  console.log('PostgreSQL: ' + DATABASE_URL.replace(/:[^:@]+@/, ':****@') + '\n');

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
    console.log('\n--- Migration Stats ---');
    console.table(stats);

    // Verify
    const verified = await verify();

    if (verified) {
      console.log('\n✓ Migration completed successfully!');
    } else {
      console.log('\n⚠ Migration completed with count mismatches. Review errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

// Import sql for count query
import { sql } from 'drizzle-orm';

main();
```

**Run migration:**
```bash
# Back up first!
cp sifi.db sifi.db.backup

# Set PostgreSQL connection
export DATABASE_URL="postgresql://..."

# Run migration
bun run scripts/migrate-data.ts
```

**Deliverables:**
- SQLite database backed up
- All data migrated to PostgreSQL
- Row counts verified
- Application tested with PostgreSQL

---

### Phase 4: Deploy to Railway

**Objective:** Configure and deploy to Railway.

**Tasks:**
- [x] Create `railway.json` configuration
- [x] Create health check endpoint
- [x] Add Node.js version configuration (already done in Phase 1)
- [ ] Set environment variables in Railway
- [ ] Deploy and test
- [ ] Remove SQLite dependencies

**Railway Config:** `railway.json`

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "bun run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Health Check:** `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch (error) {
    console.error('Health check failed:', error);
  }

  const healthy = checks.database;

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'unhealthy', checks },
    { status: healthy ? 200 : 503 }
  );
}
```

**Package.json updates:**
```json
{
  "engines": {
    "node": "22.x"
  }
}
```

**.nvmrc:**
```
22
```

**Cleanup after successful deployment:**
```bash
# Remove SQLite dependency
bun remove better-sqlite3 @types/better-sqlite3

# Remove old SQLite client code
rm src/lib/db/client-sqlite.ts  # if you kept it temporarily

# Archive backup
mv sifi.db.backup archives/sifi-sqlite-backup-2026-02-01.db
```

**Deliverables:**
- Application deployed on Railway
- Health checks passing
- SQLite dependencies removed
- Production stable

---

## Future Enhancement: R2 Attachment Storage

When attachment volume grows (50+ files or 100MB+ total), migrate to Cloudflare R2:

**Schema is already prepared:**
- `item_attachments.r2Key` column exists (nullable)
- When `r2Key` is populated, fetch from R2 instead of `data` column

**Migration path:**
1. Add R2 client and helpers
2. Create lazy migration: on attachment access, if `r2Key` is null, upload to R2 and update record
3. Or run batch migration script
4. Eventually drop `data` column after all attachments migrated

**R2 environment variables (add when needed):**
```bash
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
R2_BUCKET_NAME=sifi-attachments
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] All existing data migrated without loss
- [ ] User authentication works (login, logout, session persistence)
- [ ] All CRUD operations work for locations, items, tags, activities
- [ ] File attachments display correctly
- [ ] QR code generation and scanning works
- [ ] Search functionality returns correct results
- [ ] Hierarchical navigation works

### Non-Functional Requirements
- [ ] Application accessible via Railway public URL
- [ ] Health check endpoint returns 200 when healthy
- [ ] No SQLite dependencies remain in package.json
- [ ] Environment variables documented in `.env.example`

### Quality Gates
- [ ] TypeScript compiles without errors
- [ ] All async/await properly handled
- [ ] Database has proper indexes
- [ ] Junction tables have composite primary keys

---

## Dependencies

1. **Railway account** - Already have
2. **Current SQLite data backed up** - Before Phase 3
3. **Node 22** - Required for Next.js 16

---

## Rollback

**Before Phase 3:** Revert code changes, SQLite still works.

**After Phase 3:** Keep `sifi.db.backup`. If critical issues found, revert git and restore backup.

---

## ERD: Target PostgreSQL Schema

```mermaid
erDiagram
    users ||--o{ locations : "has"
    users ||--o{ items : "has"
    users ||--o{ tags : "has"
    users ||--o{ activities : "has"

    locations ||--o{ locations : "parent"
    locations ||--o{ items : "contains"

    items ||--o{ items : "parent_item"
    items ||--o{ item_tags : "has"
    items ||--o{ item_attachments : "has"
    items ||--o{ activity_items : "in"

    tags ||--o{ item_tags : "applied_to"
    activities ||--o{ activity_items : "contains"

    users {
        uuid id PK
        text email UK
        text name
        text password_hash
        timestamp created_at
        timestamp updated_at
    }

    locations {
        uuid id PK
        uuid user_id FK
        uuid parent_id FK
        text name
        text description
        text code
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    items {
        uuid id PK
        uuid user_id FK
        item_type type
        text name
        text description
        text code
        uuid parent_location_id FK
        uuid parent_item_id FK
        int quantity
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    tags {
        uuid id PK
        uuid user_id FK
        text name
        text color
        timestamp created_at
    }

    item_tags {
        uuid item_id PK_FK
        uuid tag_id PK_FK
    }

    activities {
        uuid id PK
        uuid user_id FK
        text name
        text description
        activity_status status
        timestamp created_at
        timestamp updated_at
    }

    activity_items {
        uuid activity_id PK_FK
        uuid item_id PK_FK
    }

    item_attachments {
        uuid id PK
        uuid item_id FK
        text data
        text r2_key
        text file_name
        text mime_type
        int file_size
        int sort_order
        timestamp created_at
    }
```

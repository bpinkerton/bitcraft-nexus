# Data Model: BitCraft Nexus Platform Infrastructure

**Feature**: 001-bitcraft-nexus-platform
**Date**: 2025-10-12
**Database**: PostgreSQL 15+ via Supabase
**ORM**: Drizzle ORM

## Purpose

This document defines the complete database schema for the BitCraft Nexus platform infrastructure. All schemas are defined in TypeScript using Drizzle ORM for type safety and automatic type inference.

## Schema Overview

The platform uses **minimal application database storage**, as game data resides in third-party SpacetimeDB (cached locally). Supabase PostgreSQL stores only:

1. User profiles and identity links (3-way: platform, Discord, BitCraft)
2. API keys for pilot phase access control
3. Audit logs for compliance and debugging
4. Session management (handled by Supabase Auth)

## Entity Relationship Diagram

```
┌─────────────────┐
│ Supabase Auth   │
│ (auth.users)    │
└────────┬────────┘
         │ 1
         │ references
         │
         │ 1
┌────────▼────────┐
│     users       │ (minimal profile)
└────────┬────────┘
         │ 1
         │
    ┌────┴────┐
    │         │
    │ 1       │ 1
┌───▼──────┐  │
│ discord_ │  │
│ links    │  │
└──────────┘  │
              │
         ┌────▼─────────┐
         │ bitcraft_    │
         │ links        │
         └──────────────┘

┌──────────────┐      ┌──────────────┐
│  api_keys    │      │ audit_logs   │
└──────────────┘      └──────────────┘
 (references users)    (references users)
```

## Tables

### 1. `users` - Platform User Profiles

Minimal user profile table that references Supabase Auth. The `id` matches `auth.users.id` for consistency.

**Purpose**: Central user identity, links to all other tables

**Drizzle Schema**:
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Matches auth.users.id
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
```

**Columns**:
- `id` (UUID, PK): Platform user ID, matches Supabase Auth user ID
- `created_at` (TIMESTAMP): Account creation timestamp
- `updated_at` (TIMESTAMP): Last profile update timestamp

**Indexes**:
- Primary key on `id` (automatic)

**Constraints**:
- `id` must match existing `auth.users.id` (enforced by application logic during user creation)

**Lifecycle**:
- **Created**: On first successful Discord OAuth login
- **Updated**: When profile metadata changes (currently minimal)
- **Deleted**: Cascade delete from Supabase Auth (soft delete in future)

**Validation Rules**:
- `id` must be valid UUID v4
- Timestamps automatically managed by database

---

### 2. `discord_links` - Discord Identity Association

Links platform users to Discord accounts via OAuth. Stores Discord user ID and username for display purposes.

**Purpose**: Enable Discord bot authentication and display Discord identity in profile

**Drizzle Schema**:
```typescript
export const discordLinks = pgTable('discord_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  discordId: text('discord_id').notNull().unique(),
  discordUsername: text('discord_username').notNull(),
  discordDiscriminator: text('discord_discriminator'), // May be null (new Discord usernames)
  discordAvatar: text('discord_avatar'), // Avatar hash
  isActive: boolean('is_active').default(true).notNull(),
  linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow().notNull(),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('discord_links_user_id_idx').on(table.userId),
  discordIdIdx: uniqueIndex('discord_links_discord_id_idx').on(table.discordId)
}))

export type DiscordLink = typeof discordLinks.$inferSelect
export type InsertDiscordLink = typeof discordLinks.$inferInsert
```

**Columns**:
- `id` (UUID, PK): Link record ID
- `user_id` (UUID, FK → users.id): Platform user
- `discord_id` (TEXT, UNIQUE): Discord user ID (snowflake)
- `discord_username` (TEXT): Discord username for display
- `discord_discriminator` (TEXT, NULLABLE): Discord discriminator (deprecated by Discord, may be null)
- `discord_avatar` (TEXT, NULLABLE): Avatar hash from Discord CDN
- `is_active` (BOOLEAN): Whether link is currently active
- `linked_at` (TIMESTAMP): When Discord account was first linked
- `last_refreshed_at` (TIMESTAMP): Last time Discord data was refreshed

**Indexes**:
- Primary key on `id`
- Index on `user_id` for lookups by platform user
- Unique index on `discord_id` for Discord bot authentication

**Constraints**:
- `user_id` references `users.id` with CASCADE delete
- `discord_id` must be unique (one Discord account per platform profile)
- `is_active` defaults to `true`

**Lifecycle**:
- **Created**: On first successful Discord OAuth login
- **Updated**: When Discord username/avatar changes (refreshed on login)
- **Soft Deleted**: Set `is_active = false` if Discord account unlinked on Discord's side
- **Hard Deleted**: Cascade when parent `users` record deleted

**Validation Rules**:
- `discord_id` must be numeric string (Discord snowflake format)
- `discord_username` length 2-32 characters
- Only one active link per `user_id`

**Edge Cases**:
- If Discord account deleted: Mark `is_active = false`, preserve data for audit
- If user wants to change Discord account: Not allowed (security measure), must contact support

---

### 3. `bitcraft_links` - BitCraft Player Identity Association

Links platform users to BitCraft player accounts via email verification. Stores verified email and player ID.

**Purpose**: Enable BitCraft-specific features (future: empire planning, resource tracking)

**Drizzle Schema**:
```typescript
export const bitcraftLinks = pgTable('bitcraft_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bitcraftEmail: text('bitcraft_email').notNull().unique(),
  bitcraftPlayerId: text('bitcraft_player_id').notNull().unique(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
  verificationMethod: text('verification_method').default('email').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  unlinkedAt: timestamp('unlinked_at', { withTimezone: true }),
  unlinkedReason: text('unlinked_reason')
}, (table) => ({
  userIdIdx: index('bitcraft_links_user_id_idx').on(table.userId),
  emailIdx: uniqueIndex('bitcraft_links_email_idx').on(table.bitcraftEmail),
  playerIdIdx: uniqueIndex('bitcraft_links_player_id_idx').on(table.bitcraftPlayerId)
}))

export type BitCraftLink = typeof bitcraftLinks.$inferSelect
export type InsertBitCraftLink = typeof bitcraftLinks.$inferInsert
```

**Columns**:
- `id` (UUID, PK): Link record ID
- `user_id` (UUID, FK → users.id): Platform user
- `bitcraft_email` (TEXT, UNIQUE): Verified BitCraft email address
- `bitcraft_player_id` (TEXT, UNIQUE): BitCraft player ID from verification API
- `verified_at` (TIMESTAMP): When email was successfully verified
- `verification_method` (TEXT): Method used (always 'email' for now)
- `is_active` (BOOLEAN): Whether link is currently active
- `unlinked_at` (TIMESTAMP, NULLABLE): When user unlinked (if applicable)
- `unlinked_reason` (TEXT, NULLABLE): Reason for unlinking (user request, duplicate, etc.)

**Indexes**:
- Primary key on `id`
- Index on `user_id` for lookups by platform user
- Unique index on `bitcraft_email` to prevent duplicate linking
- Unique index on `bitcraft_player_id` to prevent duplicate linking

**Constraints**:
- `user_id` references `users.id` with CASCADE delete
- `bitcraft_email` must be unique (one BitCraft account per platform profile)
- `bitcraft_player_id` must be unique (one platform profile per BitCraft account)
- Only one active link per `user_id`

**Lifecycle**:
- **Created**: On successful BitCraft email verification (two-step POST flow)
- **Soft Deleted**: Set `is_active = false`, set `unlinked_at` and `unlinked_reason` when user unlinks
- **Hard Deleted**: Cascade when parent `users` record deleted

**Validation Rules**:
- `bitcraft_email` must be valid email format
- `bitcraft_player_id` must match BitCraft's player ID format (TBD based on API docs)
- Cannot link if email or player ID already associated with another active profile

**Edge Cases**:
- **Duplicate linking attempt**: Check uniqueness, return error with clear message
- **User wants to change BitCraft account**: Allow unlinking (soft delete), then re-link to new account
- **BitCraft account deleted**: Keep link active (no way to verify deletion), user must manually unlink

---

### 4. `api_keys` - Pilot Phase API Key Management

Stores hashed API keys for controlled access during pilot phase. Keys are associated with metadata and usage tracking.

**Purpose**: Control API access during pilot phase, track usage per client

**Drizzle Schema**:
```typescript
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  keyHash: text('key_hash').notNull().unique(), // SHA-256 hash of full key
  keyPrefix: text('key_prefix').notNull(),      // First 11 chars for display (bcn_XXXXXXX)
  permissions: jsonb('permissions').$type<ApiKeyPermissions>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
  revokedReason: text('revoked_reason')
}, (table) => ({
  keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(table.keyHash),
  createdByIdx: index('api_keys_created_by_idx').on(table.createdBy),
  isActiveIdx: index('api_keys_is_active_idx').on(table.isActive)
}))

// TypeScript type for permissions JSONB
export interface ApiKeyPermissions {
  scopes: ('read' | 'write' | 'admin')[]
  rateLimit?: number // Override default rate limit
}

export type ApiKey = typeof apiKeys.$inferSelect
export type InsertApiKey = typeof apiKeys.$inferInsert
```

**Columns**:
- `id` (UUID, PK): API key record ID
- `name` (TEXT): Human-readable name (e.g., "Web UI Production", "Discord Bot")
- `description` (TEXT, NULLABLE): Optional description
- `key_hash` (TEXT, UNIQUE): SHA-256 hash of full API key (never store plaintext)
- `key_prefix` (TEXT): First 11 characters of key for display (e.g., "bcn_a1b2c3d")
- `permissions` (JSONB): Permissions object (scopes, rate limit overrides)
- `is_active` (BOOLEAN): Whether key is currently active
- `created_at` (TIMESTAMP): When key was generated
- `created_by` (UUID, FK → users.id): Admin who created the key
- `last_used_at` (TIMESTAMP, NULLABLE): Last time key was used in a request
- `usage_count` (INTEGER): Total number of requests made with this key
- `revoked_at` (TIMESTAMP, NULLABLE): When key was revoked
- `revoked_by` (UUID, FK → users.id): Admin who revoked the key
- `revoked_reason` (TEXT, NULLABLE): Reason for revocation

**Indexes**:
- Primary key on `id`
- Unique index on `key_hash` for fast validation lookups
- Index on `created_by` for admin auditing
- Index on `is_active` for filtering active keys

**Constraints**:
- `key_hash` must be unique (one hash per key)
- `created_by` and `revoked_by` reference `users.id` with SET NULL (preserve audit even if admin deleted)
- `is_active` defaults to `true`

**Lifecycle**:
- **Created**: Admin generates new key (returns plaintext key once, then only hash stored)
- **Updated**: `last_used_at` and `usage_count` incremented on each use
- **Revoked**: Set `is_active = false`, set `revoked_at`, `revoked_by`, `revoked_reason`
- **Never Deleted**: Keys kept for audit trail even after revocation

**Validation Rules**:
- `name` must be 1-100 characters
- `key_hash` must be 64-character hex string (SHA-256 output)
- `key_prefix` must start with "bcn_" and be 11 characters total
- `permissions.scopes` must be non-empty array

**Security Considerations**:
- **Never log full keys**: Only log `key_prefix` in logs/audit
- **Hash keys immediately**: Use SHA-256, salt not needed (keys are high entropy)
- **Rotate compromised keys**: Generate new key, revoke old one
- **Rate limit per key**: In addition to per-user rate limiting

**Edge Cases**:
- **Key regeneration**: Treat as new key creation + old key revocation (two separate records)
- **Pilot mode disabled**: Feature flag bypasses key validation, keys remain in DB for future re-enable

---

### 5. `audit_logs` - Audit Trail for Critical Operations

Immutable log of critical operations for security, compliance, and debugging.

**Purpose**: Track all authentication events, profile changes, API key operations

**Drizzle Schema**:
```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId)
}))

export type AuditLog = typeof auditLogs.$inferSelect
export type InsertAuditLog = typeof auditLogs.$inferInsert
```

**Columns**:
- `id` (UUID, PK): Audit log entry ID
- `user_id` (UUID, FK → users.id, NULLABLE): User who performed action (null for system actions)
- `action` (TEXT): Action performed (e.g., "user.login", "profile.link_bitcraft", "api_key.revoke")
- `resource_type` (TEXT, NULLABLE): Type of resource affected (e.g., "user", "api_key", "discord_link")
- `resource_id` (TEXT, NULLABLE): ID of affected resource
- `metadata` (JSONB, NULLABLE): Additional context (old/new values, error details, etc.)
- `ip_address` (TEXT, NULLABLE): IP address of request
- `user_agent` (TEXT, NULLABLE): User agent string
- `created_at` (TIMESTAMP): When action occurred

**Indexes**:
- Primary key on `id`
- Index on `user_id` for user activity queries
- Index on `action` for filtering by action type
- Index on `created_at` for time-based queries
- Composite index on `resource_type` + `resource_id` for resource history

**Constraints**:
- `user_id` references `users.id` with SET NULL (preserve audit even if user deleted)
- **Immutable**: No UPDATE or DELETE operations (append-only)

**Lifecycle**:
- **Created**: On every auditable action
- **Never Updated**: Immutable log
- **Never Deleted**: Retained indefinitely (or until compliance retention policy requires deletion)

**Logged Actions**:
- `user.created`: New user account created via Discord OAuth
- `user.login`: User authenticated successfully
- `user.logout`: User signed out
- `discord.linked`: Discord account linked
- `discord.refreshed`: Discord profile data refreshed
- `bitcraft.link_requested`: BitCraft verification code requested
- `bitcraft.link_verified`: BitCraft account successfully verified and linked
- `bitcraft.unlinked`: User unlinked BitCraft account
- `api_key.created`: New API key generated
- `api_key.revoked`: API key revoked
- `api_key.used`: API key used in request (logged async to avoid blocking)
- `error.auth_failed`: Authentication attempt failed
- `error.rate_limit`: Rate limit exceeded

**Validation Rules**:
- `action` must match predefined action enum (or free-text with prefix)
- `created_at` automatically set by database

**Query Patterns**:
```typescript
// Get user's recent activity
await db.query.auditLogs.findMany({
  where: eq(auditLogs.userId, userId),
  orderBy: desc(auditLogs.createdAt),
  limit: 50
})

// Get all API key operations
await db.query.auditLogs.findMany({
  where: like(auditLogs.action, 'api_key.%'),
  orderBy: desc(auditLogs.createdAt)
})

// Get resource history
await db.query.auditLogs.findMany({
  where: and(
    eq(auditLogs.resourceType, 'bitcraft_link'),
    eq(auditLogs.resourceId, linkId)
  ),
  orderBy: asc(auditLogs.createdAt)
})
```

---

## Migration Strategy

### Development Workflow

1. **Update Schema**: Edit `lib/db/schema.ts` with new tables/columns
2. **Push to Local DB**: Run `pnpm db:push` (bypasses migrations, direct schema update)
3. **Test**: Verify schema changes in Drizzle Studio (`pnpm db:studio`)
4. **Iterate**: Repeat until schema finalized

### Production Workflow

1. **Generate Migration**: Run `pnpm db:generate` (creates SQL migration in `supabase/migrations/`)
2. **Review SQL**: Manually inspect generated SQL for correctness
3. **Test Migration**: Run `pnpm supabase:reset` locally to test migration from scratch
4. **Commit**: Commit both `schema.ts` and generated migration files
5. **Deploy**: Supabase automatically runs migrations on deployment

### Migration Naming Convention

Drizzle auto-generates migration names with timestamp prefix:
- `0000_curly_locust.sql` (initial schema)
- `0001_brainy_hulk.sql` (add api_keys table)
- `0002_silly_beast.sql` (add audit_logs indexes)

**Manual Rename** for clarity (optional):
- `0000_initial_schema.sql`
- `0001_add_api_keys.sql`
- `0002_audit_log_indexes.sql`

---

## Seeding Strategy

### Development Seeds

For local development, seed with:
- 1 test user (matches a real Discord account for OAuth testing)
- 1 Discord link (pre-linked)
- 1 BitCraft link (pre-linked, fake player ID)
- 2 API keys (one for web UI, one for Discord bot)

**Seed Script** (future):
```typescript
// scripts/seed.ts
import { db } from '@/lib/db'
import { users, discordLinks, apiKeys } from '@/lib/db/schema'

const TEST_USER_ID = 'your-supabase-auth-user-id'

await db.insert(users).values({
  id: TEST_USER_ID
})

await db.insert(discordLinks).values({
  userId: TEST_USER_ID,
  discordId: '123456789012345678',
  discordUsername: 'testuser'
})

// etc...
```

### Production Seeds

**No default seeds in production**. Admin API keys created manually via Supabase SQL Editor:

```sql
-- Generate admin API key (run once, record key_hash manually)
INSERT INTO api_keys (name, key_hash, key_prefix, permissions, created_by)
VALUES (
  'Production Web UI',
  'abc123...', -- Replace with actual SHA-256 hash
  'bcn_a1b2c3d',
  '{"scopes": ["read", "write"]}'::jsonb,
  NULL
);
```

---

## Row-Level Security (RLS) Policies

**Defer RLS policies to post-pilot**. For pilot phase:
- Use service role key for all database operations (bypass RLS)
- Enforce access control at application layer (middleware, Server Actions)

**Future RLS Policies**:
- Users can read only their own profile data
- Users cannot modify Discord/BitCraft links directly (only via verified Server Actions)
- API keys table accessible only by admins
- Audit logs readable by admins only

---

## Performance Considerations

### Query Optimization

- **Indexes**: Added on foreign keys and frequently queried columns
- **Pagination**: Use `LIMIT` and `OFFSET` for large result sets
- **Partial Indexes**: Consider `WHERE is_active = true` indexes if many inactive records

### Connection Pooling

Drizzle with Supabase uses connection pooling by default:
- **Transaction Mode**: `?pgbouncer=true` in DATABASE_URL
- **Max Connections**: Configure in Supabase dashboard (default: 15 for Free tier, 60+ for Pro)

### Monitoring

- Monitor slow queries via Supabase dashboard
- Set alert for connection pool exhaustion
- Track audit log table growth (consider partitioning if exceeds 1M rows)

---

## Data Retention & Privacy

### GDPR Compliance

- **Right to Access**: Users can export their data via API (future feature)
- **Right to Erasure**: Hard delete cascade on `users` table removes all associated data
- **Data Minimization**: Only store essential fields (no tracking cookies, no analytics in DB)

### Retention Policy

- **Active Users**: Data retained indefinitely while account active
- **Deleted Accounts**: 30-day grace period (soft delete), then hard delete
- **Audit Logs**: Retained for 2 years, then archived or deleted based on compliance needs

---

## Future Enhancements

### Post-Pilot

1. **User Preferences Table**: Store UI preferences, notification settings
2. **Sessions Table**: Custom session management (currently using Supabase Auth)
3. **Rate Limit Cache Table**: Move from in-memory/Redis to PostgreSQL for cost savings
4. **Feature Flags Table**: Database-driven feature flags per user cohort

### Future Features

1. **Saved Recipes Table**: User-favorited recipes from game data
2. **Map Markers Table**: User-placed markers on interactive maps
3. **Empire Plans Table**: User-created empire planning data
4. **Discord Bot Usage Table**: Track bot command usage per guild/user

---

## Schema Export for Reference

**Full Drizzle Schema** will be implemented in `lib/db/schema.ts`:

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'

// [Full schema definitions as documented above]

// Export all types
export type User = typeof users.$inferSelect
export type DiscordLink = typeof discordLinks.$inferSelect
export type BitCraftLink = typeof bitcraftLinks.$inferSelect
export type ApiKey = typeof apiKeys.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect

// Export insert types
export type InsertUser = typeof users.$inferInsert
export type InsertDiscordLink = typeof discordLinks.$inferInsert
export type InsertBitCraftLink = typeof bitcraftLinks.$inferInsert
export type InsertApiKey = typeof apiKeys.$inferInsert
export type InsertAuditLog = typeof auditLogs.$inferInsert
```

---

## Validation with Zod

**Server-side validation schemas** for all mutations:

```typescript
// lib/validators/schemas.ts
import { z } from 'zod'

export const linkBitCraftRequestSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const linkBitCraftVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be 6 characters')
})

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.object({
    scopes: z.array(z.enum(['read', 'write', 'admin'])).min(1),
    rateLimit: z.number().int().positive().optional()
  })
})

export const revokeApiKeySchema = z.object({
  keyId: z.string().uuid(),
  reason: z.string().max(500).optional()
})
```

---

## Next Steps

1. **Implement schema in code**: Create `lib/db/schema.ts` with all definitions
2. **Generate initial migration**: Run `pnpm db:generate`
3. **Create Drizzle client**: Set up `lib/db/index.ts` with connection
4. **Test locally**: Verify schema with Drizzle Studio
5. **Proceed to API contracts**: Define OpenAPI specs for authentication endpoints

# Technical Research: BitCraft Nexus Platform Infrastructure

**Feature**: 001-bitcraft-nexus-platform
**Date**: 2025-10-12
**Status**: Complete

## Purpose

This document consolidates technical research and decisions made during Phase 0 planning to resolve all "NEEDS CLARIFICATION" items from Technical Context and establish patterns for implementation.

## Research Areas

### 1. Discord OAuth Integration via Supabase

**Decision**: Use Supabase Auth's native Discord OAuth provider with SSR cookie pattern

**Rationale**:
- Supabase Auth handles OAuth flow complexity (redirect, token exchange, session management)
- Built-in PKCE (Proof Key for Code Exchange) security for OAuth 2.0
- Automatic JWT generation and refresh token rotation
- SSR-compatible via `@supabase/ssr` package with cookie-based sessions
- No need to implement custom OAuth state management or CSRF protection

**Implementation Pattern**:
```typescript
// lib/supabase/server.ts - Server-side client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          cookieStore.delete({ name, ...options })
        }
      }
    }
  )
}
```

**Alternatives Considered**:
- **NextAuth.js**: More complex setup, Supabase already provides auth infrastructure
- **Custom OAuth implementation**: Reinventing the wheel, higher security risk
- **Passport.js**: Server-only, doesn't integrate with Next.js App Router patterns

**References**:
- Supabase SSR Documentation: https://supabase.com/docs/guides/auth/server-side
- Discord OAuth Provider Setup: https://supabase.com/docs/guides/auth/social-login/auth-discord

---

### 2. SpacetimeDB WebSocket Integration with Caching

**Decision**: Implement on-demand websocket connections with in-memory cache layer and category-specific TTLs

**Rationale**:
- SpacetimeDB SDK provides real-time subscriptions, but no realtime features in scope yet
- Use SDK for read-only queries over websocket protocol
- Implement application-level cache to reduce websocket traffic (95%+ cache hit rate target)
- Category-based TTLs align with data update frequency

**Implementation Pattern**:
```typescript
// lib/spacetime/client.ts
import { SpacetimeDBClient } from '@clockworklabs/spacetime-sdk'

export class GameDataClient {
  private client: SpacetimeDBClient
  private cache: Map<string, CacheEntry>

  async connect() {
    this.client = new SpacetimeDBClient(process.env.SPACETIME_URI!)
    await this.client.connect()
  }

  async query<T>(category: DataCategory, query: Query): Promise<T> {
    const cacheKey = generateKey(query)
    const cached = this.cache.get(cacheKey)

    if (cached && !isExpired(cached, category)) {
      return cached.data as T
    }

    const data = await this.client.query(query)
    this.cache.set(cacheKey, {
      data,
      fetchedAt: Date.now(),
      category
    })

    return data
  }
}

// lib/spacetime/cache.ts
enum DataCategory {
  STATIC = 'static',        // 24h TTL - recipes, items
  SEMI_STATIC = 'semi',     // 6h TTL - resource nodes, biomes
  DYNAMIC = 'dynamic',      // 1h TTL - territories, economy
  REALTIME = 'realtime'     // 5min TTL - player counts
}

const TTL_CONFIG = {
  [DataCategory.STATIC]: 24 * 60 * 60 * 1000,      // 24 hours
  [DataCategory.SEMI_STATIC]: 6 * 60 * 60 * 1000,  // 6 hours
  [DataCategory.DYNAMIC]: 60 * 60 * 1000,          // 1 hour
  [DataCategory.REALTIME]: 5 * 60 * 1000           // 5 minutes
}
```

**Cache Invalidation Strategy**:
- TTL-based expiration (no manual invalidation for pilot)
- Serve stale data if SpacetimeDB unavailable (with staleness indicator)
- Future: Add manual invalidation hooks for admin-triggered updates

**Alternatives Considered**:
- **Redis caching**: Adds infrastructure complexity, in-memory sufficient for pilot scale
- **No caching**: Would exceed rate limits and increase latency significantly
- **Single global TTL**: Doesn't match varied data update frequencies

**References**:
- SpacetimeDB SDK: https://github.com/clockworklabs/spacetimedb-sdk
- Node.js caching patterns: https://nodejs.org/en/docs/guides/simple-profiling/

---

### 3. BitCraft Email Verification API Integration

**Decision**: Implement two-step verification flow matching existing spacetime-auth module pattern

**Confirmed API Details**: (from scripts/modules/spacetime-auth.ts)
- **Base URL**: `https://api.bitcraftonline.com/authentication`
- **Step 1**: `POST /request-access-code?email={email}` (query param, not JSON body)
- **Step 2**: `POST /authenticate?email={email}&accessCode={code}` (query params)
- **Access Code Format**: 6-character alphanumeric (e.g., "ABC123")
- **Response**: JWT token (string or object with `token` field)
- **Use native `fetch` API** (no Axios dependency)

**Implementation Pattern**:
```typescript
// lib/bitcraft-api/verification.ts
const AUTH_API_BASE = 'https://api.bitcraftonline.com/authentication';

export class BitCraftVerificationClient {
  // Step 1: Request access code (sends email with 6-char code)
  async requestAccessCode(email: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${AUTH_API_BASE}/request-access-code?email=${encodeURIComponent(email)}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new VerificationError(
        `Failed to request access code: ${response.status} ${response.statusText}`
      )
    }

    return { success: true }
  }

  // Step 2: Verify code - returns JWT token (which we discard per spec)
  async verifyCode(email: string, code: string): Promise<{ playerId: string }> {
    const response = await fetch(
      `${AUTH_API_BASE}/authenticate?email=${encodeURIComponent(email)}&accessCode=${code}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new VerificationError('Invalid access code')
      }
      throw new VerificationError(
        `Authentication failed: ${response.status} ${response.statusText}`
      )
    }

    const authData = await response.json()

    // API returns JWT token (as string or object with token field)
    let token: string
    if (typeof authData === 'string') {
      token = authData
    } else {
      token = authData.token || authData.authToken || authData.access_token
    }

    if (!token) {
      throw new VerificationError('No token in authentication response')
    }

    // Extract player ID from JWT payload
    const playerId = this.extractPlayerIdFromToken(token)

    // IMPORTANT: Discard token - we only store email and player ID
    // (Unlike spacetime-auth which stores SPACETIME_AUTH_TOKEN)
    return { playerId }
  }

  private extractPlayerIdFromToken(token: string): string {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      )

      // Extract player ID from JWT claims
      // Adjust field name based on actual token structure
      const playerId = payload.sub || payload.userId || payload.player_id || payload.playerId

      if (!playerId) {
        throw new Error('No player ID found in token')
      }

      return playerId
    } catch (error) {
      throw new VerificationError('Failed to parse authentication token')
    }
  }
}
```

**Error Handling**:
- **401/403**: Invalid access code → Allow 3 attempts before rate limit
- **Non-2xx**: API error → Show retry option
- **Invalid JWT**: Token parsing fails → Log error, ask user to retry
- **Email already linked**: Check uniqueness before calling API
- **API unavailable**: Catch network errors, show friendly message

**Security Considerations**:
- Rate limit verification attempts per IP (10/hour)
- Store verification attempts in audit log
- Never log full token (only first 10 chars for debugging if needed)
- Never expose raw API responses to client

**Key Difference from SpacetimeDB Auth**:
- **SpacetimeDB**: Stores `SPACETIME_AUTH_TOKEN` for future API calls
- **BitCraft Profile Linking**: Extracts player ID, discards token (one-time verification)

---

### 4. Rate Limiting Implementation

**Decision**: Use `@upstash/ratelimit` with Vercel KV storage for production, in-memory for local dev

**Rationale**:
- 500 requests/minute per authenticated user (clarified in spec)
- Need distributed rate limiting for horizontal scaling
- Upstash Ratelimit provides Redis-backed rate limiting with fallback
- Integrates well with Vercel deployment

**Implementation Pattern**:
```typescript
// lib/rate-limit/index.ts
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(500, '1 m'), // 500 requests per minute
  analytics: true,
  prefix: 'ratelimit:user'
})

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const { success, limit, remaining, reset } = await ratelimit.limit(userId)

  if (!success) {
    throw new RateLimitError({
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
      limit,
      remaining: 0
    })
  }

  return { success: true, remaining, reset }
}

// Middleware for API routes
export function withRateLimit(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const userId = await getUserIdFromRequest(req)

    try {
      await checkRateLimit(userId)
      return handler(req, res)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: error.retryAfter
        })
      }
      throw error
    }
  }
}
```

**Local Development**:
- Use in-memory Map for rate limiting (no Redis required)
- Environment variable switches between implementations

**Alternatives Considered**:
- **Express rate-limit middleware**: Not designed for Next.js App Router
- **Nginx rate limiting**: Requires infrastructure control, not suitable for Vercel
- **Custom Redis implementation**: Reinventing the wheel

**References**:
- Upstash Ratelimit: https://github.com/upstash/ratelimit
- Vercel KV: https://vercel.com/docs/storage/vercel-kv

---

### 5. API Key Management for Pilot Phase

**Decision**: Store hashed API keys in Supabase PostgreSQL, validate on every protected request

**Rationale**:
- Pilot phase requires controlled access (web UI, Discord bot, approved participants)
- Store keys hashed (SHA-256) to prevent leak exposure
- Associate keys with metadata (name, permissions, usage tracking)
- Feature flag for transitioning to fully public API

**Implementation Pattern**:
```typescript
// lib/db/schema.ts (Drizzle schema)
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(), // SHA-256 hash
  keyPrefix: text('key_prefix').notNull(),      // First 8 chars for display
  permissions: jsonb('permissions').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0).notNull(),
  createdBy: uuid('created_by').references(() => users.id)
})

// lib/api-keys/index.ts
import { createHash, randomBytes } from 'crypto'

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `bcn_${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = key.slice(0, 11) // 'bcn_' + 7 chars

  return { key, hash, prefix }
}

export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  const hash = createHash('sha256').update(key).digest('hex')

  const result = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, hash)
  })

  if (!result || !result.isActive) {
    return null
  }

  // Update usage tracking (async, don't block)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date(), usageCount: result.usageCount + 1 })
    .where(eq(apiKeys.id, result.id))
    .catch(console.error)

  return result
}
```

**Security Considerations**:
- Never log full API keys (only prefix)
- Rotate keys if compromised (new key, revoke old)
- Audit log for key generation/revocation
- Feature flag to disable key requirement post-pilot

**Alternatives Considered**:
- **JWT tokens**: More complex, keys sufficient for pilot
- **OAuth client credentials**: Overkill for simple API key access

---

### 6. Discord Bot Architecture

**Decision**: Separate Node.js process using discord.js, communicates with platform via REST API

**Rationale**:
- Bot needs persistent WebSocket connection to Discord Gateway
- No code sharing with Next.js app (prevents tight coupling)
- All business logic in REST API (bot is pure interface layer)
- Authenticate users via Discord ID → platform profile mapping

**Implementation Pattern**:
```typescript
// discord-bot/index.ts
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js'
import { PlatformApiClient } from './api-client'

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

const apiClient = new PlatformApiClient({
  baseUrl: process.env.PLATFORM_API_URL!,
  apiKey: process.env.BOT_API_KEY!
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === 'profile') {
    await interaction.deferReply({ ephemeral: true })

    try {
      const profile = await apiClient.getProfileByDiscordId(interaction.user.id)

      const embed = {
        title: 'Your BitCraft Nexus Profile',
        fields: [
          { name: 'Platform ID', value: profile.id },
          { name: 'Discord', value: `${interaction.user.username}` },
          { name: 'BitCraft Account', value: profile.bitcraftEmail || 'Not linked' }
        ]
      }

      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      if (error.status === 404) {
        await interaction.editReply({
          content: 'Profile not found. Visit https://nexus.bitcraftgame.com to create one.'
        })
      } else {
        await interaction.editReply({
          content: 'An error occurred. Please try again later.'
        })
      }
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN!)
```

**Deployment Considerations**:
- Separate deployment from Next.js app
- Environment: API URL, bot token, API key
- Health checks and automatic restart on disconnect
- Log all command invocations for debugging

**Alternatives Considered**:
- **Embed bot in Next.js**: Conflicts with serverless deployment model
- **Separate framework (discord.py)**: Introduces Python, increases complexity
- **Cloud functions per command**: Cold start latency unacceptable

**References**:
- discord.js Guide: https://discordjs.guide/
- Discord Application Commands: https://discord.com/developers/docs/interactions/application-commands

---

### 7. Database Schema Strategy (Drizzle + Supabase)

**Decision**: Define schemas in TypeScript using Drizzle ORM, generate migrations for production

**Rationale**:
- Type-safe queries with IntelliSense
- Schema as code (version controlled, reviewed)
- `db:push` for rapid dev iteration, `db:generate` for production migrations
- Automatic TypeScript type inference from schema

**Schema Organization**:
```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'

// Users table (minimal - Supabase Auth handles most auth data)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Matches Supabase auth.users.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Discord identity link
export const discordLinks = pgTable('discord_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  discordId: text('discord_id').notNull().unique(),
  discordUsername: text('discord_username').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  linkedAt: timestamp('linked_at').defaultNow().notNull()
})

// BitCraft identity link
export const bitcraftLinks = pgTable('bitcraft_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  bitcraftEmail: text('bitcraft_email').notNull().unique(),
  bitcraftPlayerId: text('bitcraft_player_id').notNull().unique(),
  verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  verificationMethod: text('verification_method').default('email').notNull()
})

// API keys
export const apiKeys = pgTable('api_keys', {
  // [Defined above in API Key Management section]
})

// Audit log
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Type exports
export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
// Repeat for all tables...
```

**Migration Workflow**:
1. Dev: Update `schema.ts` → run `pnpm db:push` → instant schema update
2. Production: Run `pnpm db:generate` → review generated SQL → commit → deploy

**Alternatives Considered**:
- **Prisma**: Less TypeScript-native, heavier runtime
- **TypeORM**: More complex, repository pattern conflicts with Server Components
- **Raw SQL**: Loses type safety, harder to maintain

**References**:
- Drizzle with Supabase: https://orm.drizzle.team/docs/get-started-postgresql#supabase
- Schema Definition: https://orm.drizzle.team/docs/sql-schema-declaration

---

### 8. Minimal Logging Strategy (Pilot Phase)

**Decision**: Console logs + Supabase audit table, defer structured observability to post-pilot

**Rationale**:
- Pilot phase: Minimize infrastructure complexity
- Console logs sufficient for Vercel deployment (automatic log aggregation)
- Audit table for compliance (profile changes, API key operations)
- Defer Prometheus/OpenTelemetry until scaling needs justify complexity

**Implementation Pattern**:
```typescript
// lib/logging/index.ts
export function logInfo(message: string, context?: Record<string, unknown>) {
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    message,
    ...context
  }))
}

export function logError(error: Error, context?: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    ...context
  }))
}

// lib/audit/index.ts
export async function auditLog(data: AuditLogEntry) {
  await db.insert(auditLogs).values({
    userId: data.userId,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    metadata: data.metadata,
    ipAddress: data.ipAddress
  })
}
```

**Logged Events**:
- All API requests (endpoint, user ID, response time, status code)
- Authentication events (login, logout, session refresh)
- Profile changes (Discord link, BitCraft link, unlink)
- API key operations (create, revoke, usage)
- Errors with stack traces

**Future Observability**:
- Structured logging with Winston/Pino
- Metrics with Prometheus + Grafana
- Distributed tracing with OpenTelemetry
- APM with Vercel Analytics or DataDog

---

## Technology Stack Summary

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Runtime** | Node.js | 20+ | LTS, required for Next.js 15 |
| **Framework** | Next.js | 15+ | App Router, React Server Components |
| **Language** | TypeScript | 5+ | Type safety, developer experience |
| **UI Framework** | React | 19 | Server Components, streaming |
| **Styling** | Tailwind CSS | 4 | Utility-first, fast iteration |
| **Component Library** | shadcn/ui + Radix UI | Latest | Accessible, customizable, unstyled primitives |
| **Database** | PostgreSQL (Supabase) | 15+ | Relational, JSON support, managed |
| **ORM** | Drizzle ORM | Latest | TypeScript-native, lightweight, type-safe |
| **Auth Provider** | Supabase Auth | Latest | OAuth, SSR cookies, JWT handling |
| **Game Data** | SpacetimeDB SDK | Latest | WebSocket queries, real-time ready |
| **Discord Bot** | discord.js | 14+ | Mature, well-documented, TypeScript support |
| **Rate Limiting** | @upstash/ratelimit | Latest | Distributed, Vercel KV compatible |
| **Validation** | Zod | Latest | TypeScript-first schema validation |
| **API Mocking** | MSW (Mock Service Worker) | 2+ | WebSocket + HTTP mocking, universal |
| **Package Manager** | pnpm | 8+ | Fast, disk-efficient, strict |
| **Deployment** | Vercel | - | Optimized for Next.js, serverless functions |

---

## Environment Variables Required

```bash
# Supabase (Auth + Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# SpacetimeDB (Game Data)
SPACETIME_URI=wss://spacetime.bitcraftgame.com
SPACETIME_MODULE=bitcraft_game_data

# BitCraft Verification API
BITCRAFT_API_URL=https://api.bitcraftgame.com
BITCRAFT_API_KEY=your-api-key

# Discord Bot
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# Platform Config
PLATFORM_API_URL=https://nexus.bitcraftgame.com
BOT_API_KEY=your-bot-api-key
PILOT_MODE_ENABLED=true

# Rate Limiting (Vercel KV)
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token

# Next.js
NEXT_PUBLIC_APP_URL=https://nexus.bitcraftgame.com
```

---

## Open Questions / Dependencies

### External Dependencies (Blocking)
1. **BitCraft Verification API**: Need official documentation
   - Endpoint URLs
   - Request/response schemas
   - Rate limits
   - Error codes
   - **Action**: Request from BitCraft team

2. **SpacetimeDB Connection Details**: Need production credentials
   - WebSocket URI
   - Module name
   - Authentication method (if any)
   - Query syntax/examples
   - **Action**: Request from BitCraft team

3. **Discord Application Setup**: Need credentials
   - Bot token
   - OAuth client ID/secret
   - Redirect URI approval
   - **Action**: Create Discord app, configure in Supabase

### Internal Decisions (Non-blocking)
1. **Hosting Provider**: Vercel assumed, Docker containerization for flexibility
2. **Domain Name**: nexus.bitcraftgame.com assumed
3. **Admin UI**: Defer to post-pilot, manual SQL for API key management acceptable initially

---

### 9. WebSocket Mocking for SpacetimeDB Testing

**Decision**: Use MSW (Mock Service Worker) v2+ with WebSocket support for local development and testing

**Rationale**:
- MSW is the first and currently most comprehensive API mocking library with native WebSocket support
- Supports raw WebSocket protocol, Socket.IO, and GraphQL WS
- Works across all environments (browser, Node.js, Jest, Vitest) without additional configuration
- Type-safe mocking with TypeScript support
- Framework and tool agnostic - no special setup required for Next.js

**Implementation Pattern**:
```typescript
// mocks/spacetime/handlers.ts
import { ws } from 'msw'

export const spacetimeHandlers = [
  ws.link('wss://spacetime.bitcraftgame.com/*'),

  ws.on('connection', ({ client }) => {
    // Mock SpacetimeDB connection handshake
    client.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now()
    }))

    // Listen for query requests
    client.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'query') {
        // Return mock game data based on query
        const mockData = generateMockGameData(message.query)
        client.send(JSON.stringify({
          type: 'queryResult',
          data: mockData
        }))
      }
    })
  })
]

// Mock data generators for different SpacetimeDB tables
function generateMockGameData(query: Query) {
  switch (query.table) {
    case 'players':
      return {
        rows: [
          { id: '1', name: 'TestPlayer', online: true },
          { id: '2', name: 'DevPlayer', online: false }
        ]
      }
    case 'territories':
      return {
        rows: [
          { id: 't1', owner: '1', name: 'Home Base', population: 50 }
        ]
      }
    default:
      return { rows: [] }
  }
}
```

**Test Setup**:
```typescript
// mocks/browser.ts (for browser/dev environment)
import { setupWorker } from 'msw/browser'
import { spacetimeHandlers } from './spacetime/handlers'

export const worker = setupWorker(...spacetimeHandlers)

// mocks/server.ts (for Node.js/testing)
import { setupServer } from 'msw/node'
import { spacetimeHandlers } from './spacetime/handlers'

export const server = setupServer(...spacetimeHandlers)

// vitest.setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Environment-Specific Behavior**:
```typescript
// lib/spacetime/client.ts
import { SpacetimeDBClient } from '@clockworklabs/spacetime-sdk'

export async function createSpacetimeClient() {
  const uri = process.env.NODE_ENV === 'test'
    ? 'wss://localhost:8080/mock'  // MSW intercepts this
    : process.env.SPACETIME_URI!

  const client = new SpacetimeDBClient(uri)
  await client.connect()
  return client
}
```

**Advantages over Alternatives**:

| Library | WebSocket Support | TypeScript | Multi-Environment | Status |
|---------|------------------|-----------|-------------------|--------|
| **MSW** | ✅ Native (v2+) | ✅ Full | ✅ Browser + Node | Active |
| **Mirage JS** | ❌ No native support | ✅ Yes | ✅ Yes | Active but limited |
| **mock-socket** | ✅ Native | ✅ Declarations included | ❌ Browser API only | Maintenance mode |
| **jest-websocket-mock** | ⚠️ Browser API only | ✅ Yes | ❌ Jest only | Limited |

**Why Not Mirage JS**:
- Mirage JS has **no native WebSocket support** (GitHub issues #588, #23 open since 2019)
- Requires manual integration with `mock-socket` library
- `mock-socket` only implements browser WebSocket API (incompatible with `ws` library used by SpacetimeDB)
- Does not support Socket.IO
- More complex setup for WebSocket scenarios

**Why Not mock-socket**:
- Only implements browser WebSocket API
- SpacetimeDB SDK may use Node.js `ws` library internally (incompatible)
- Limited TypeScript support (declarations only, not type-safe)
- Lower-level API requires more boilerplate

**Why Not jest-websocket-mock**:
- Jest-specific (not compatible with Vitest or browser tests)
- Same browser API limitation as mock-socket
- Requires separate setup for development vs testing

**MSW Advantages**:
- **First-class WebSocket support**: Works with raw WebSocket, Socket.IO, and GraphQL WS
- **Universal**: Same mocks work in browser, Node.js, Jest, Vitest, Playwright
- **Type-safe**: Full TypeScript support with IntelliSense
- **Network-level interception**: No changes to application code required
- **Active development**: v2.0+ released in 2024 with WebSocket support

**Development Workflow**:
1. **Local Dev**: Enable MSW in browser (`worker.start()` in dev mode)
2. **Unit Tests**: MSW server automatically intercepts WebSocket connections
3. **Integration Tests**: Same MSW handlers work in Playwright/Cypress
4. **E2E Tests**: Disable MSW to test against real SpacetimeDB

**Mock Data Organization**:
```
mocks/
├── browser.ts              # Browser worker setup
├── server.ts               # Node.js server setup
└── spacetime/
    ├── handlers.ts         # WebSocket handlers
    ├── data/
    │   ├── players.ts      # Mock player data
    │   ├── territories.ts  # Mock territory data
    │   └── economy.ts      # Mock economy data
    └── scenarios/
        ├── empty-world.ts  # Scenario: no data
        ├── active-game.ts  # Scenario: typical active game
        └── stress-test.ts  # Scenario: high load data
```

**BitCraft API Mocking**:
MSW also handles REST API mocking for BitCraft verification API:

```typescript
// mocks/bitcraft/handlers.ts
import { http, HttpResponse } from 'msw'

export const bitcraftHandlers = [
  http.post('https://api.bitcraftonline.com/authentication/request-access-code', () => {
    return HttpResponse.json({ success: true })
  }),

  http.post('https://api.bitcraftonline.com/authentication/authenticate', () => {
    const mockToken = generateMockJWT({ playerId: 'test-player-123' })
    return HttpResponse.json({ token: mockToken })
  })
]
```

**Deployment Considerations**:
- MSW worker files excluded from production build (conditional import)
- Environment variable: `ENABLE_API_MOCKING=true` for staging environments
- Zero runtime overhead in production (tree-shaken out)

**References**:
- MSW Documentation: https://mswjs.io/docs/
- MSW WebSocket API: https://mswjs.io/docs/api/ws
- MSW Comparison: https://mswjs.io/docs/comparison/
- GitHub Issues: Mirage JS #588 (WebSocket support requested), mock-socket limitations

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "msw": "^2.0.0"
  }
}
```

---

## Next Steps

Phase 0 complete. Proceed to Phase 1:
1. Create `data-model.md` with full Drizzle schemas
2. Generate OpenAPI contracts in `/contracts/`
3. Create `quickstart.md` with setup instructions
4. Update agent context with new technologies

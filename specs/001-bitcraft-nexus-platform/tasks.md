# Tasks: BitCraft Nexus Platform Infrastructure

**Feature Branch**: `001-bitcraft-nexus-platform`
**Input**: Design documents from `/specs/001-bitcraft-nexus-platform/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅
**Generated**: 2025-10-13
**Last Updated**: 2025-10-13

**Tests**: Not requested in feature specification - deferred per constitution Principle VII (Pragmatic Testing). Manual testing procedures documented in quickstart.md.

**Organization**: Tasks are grouped by user story (P1-P6 from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6, or SETUP/FOUNDATION)
- All file paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Next.js 15 project with TypeScript, configure tooling, and establish project structure

**Duration Estimate**: 2-3 hours

- [ ] **T001** [P] [SETUP] Initialize Next.js 15 project with App Router and TypeScript 5+ strict mode
  - Run: `npx create-next-app@latest bitcraft-nexus --typescript --tailwind --app --use-pnpm --import-alias "@/*"`
  - Configure: `tsconfig.json` with strict mode enabled
  - Verify: `pnpm dev` starts successfully

- [ ] **T002** [P] [SETUP] Install core dependencies (Supabase, Drizzle, SpacetimeDB, discord.js)
  - Add: `@supabase/ssr`, `@supabase/supabase-js`, `drizzle-orm`, `drizzle-kit`
  - Add: `@clockworklabs/spacetimedb-sdk` for game data integration
  - Add: `discord.js` v14+ for bot framework
  - Add: `@upstash/ratelimit`, `@vercel/kv` for rate limiting
  - Add: `zod` for validation
  - File: `package.json`

- [ ] **T003** [P] [SETUP] Install shadcn/ui and initialize component library
  - Run: `pnpm dlx shadcn-ui@latest init`
  - Configure: `components.json` with Tailwind CSS 4 integration
  - Add initial components: Button, Card, Form, Input, Label
  - Files: `components/ui/*`, `components.json`, `tailwind.config.ts`

- [ ] **T004** [P] [SETUP] Configure ESLint, Prettier, and conventional commits
  - Configure: `.eslintrc.json` with Next.js + TypeScript rules
  - Add: `prettier.config.js` with project formatting rules
  - Install: `husky` + `commitlint` for conventional commits
  - Add: Pre-commit hooks for linting and commit message validation
  - Files: `.eslintrc.json`, `prettier.config.js`, `.husky/`, `commitlint.config.js`

- [ ] **T005** [P] [SETUP] Create project directory structure per plan.md
  - Create: `app/(auth)/`, `app/(public)/`, `app/api/`, `app/actions/`
  - Create: `components/auth/`, `components/admin/`, `components/providers/`
  - Create: `lib/db/`, `lib/supabase/`, `lib/spacetime/`, `lib/bitcraft-api/`, `lib/rate-limit/`, `lib/validators/`
  - Create: `discord-bot/` for separate bot process
  - Create: `docs/` for project documentation
  - Files: Full directory structure from plan.md lines 126-236

- [ ] **T006** [P] [SETUP] Configure environment variables template
  - Create: `.env.example` with all required environment variables
  - Document: Supabase URLs, Discord OAuth credentials, BitCraft API, rate limiting
  - Reference: quickstart.md lines 50-80 for complete list
  - Files: `.env.example`

- [ ] **T007** [P] [SETUP] Initialize Supabase local development
  - Install: Supabase CLI (`pnpm install -g supabase`)
  - Initialize: `npx supabase init` (creates `supabase/` directory)
  - Configure: `supabase/config.toml` with Discord OAuth provider
  - Files: `supabase/config.toml`, `supabase/.gitignore`

- [ ] **T008** [P] [SETUP] Configure Drizzle ORM
  - Create: `drizzle.config.ts` with Supabase connection
  - Add scripts: `"db:push"`, `"db:generate"`, `"db:studio"` to package.json
  - Configure: Connection to local Supabase PostgreSQL (port 54322)
  - Files: `drizzle.config.ts`, `package.json`

- [ ] **T009** [P] [SETUP] Create Next.js middleware structure
  - Create: `middleware.ts` for auth session refresh
  - Implement: Supabase Auth session update on every request
  - Reference: research.md lines 26-48 for SSR pattern
  - Files: `middleware.ts`

- [ ] **T010** [P] [SETUP] Configure Tailwind CSS 4 and dark mode with BitCraft Nexus brand colors
  - Update: `tailwind.config.ts` with BitCraft Nexus brand color tokens
  - Add: Logo-derived colors (nexus-purple: #9333EA, nexus-violet: #7C3AED, nexus-blue: #3B82F6, nexus-cyan: #06B6D4)
  - Add: Brand gradients (`nexus-outer`: purple→violet→blue diagonal, `nexus-center`: cyan→blue diagonal)
  - Update: `app/globals.css` with logo color CSS variables for seamless theming
  - Install: `next-themes` for dark mode without FOUC ✅ (already installed)
  - Verify: ThemeProvider in `app/layout.tsx` ✅ (already configured)
  - Reference: Logo analysis - `public/bitcraft-nexus-icon.svg` color palette
  - Files: `tailwind.config.ts`, `app/globals.css`

**Checkpoint**: Project structure initialized, dependencies installed, local dev environment ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Duration Estimate**: 4-6 hours

### Database Schema (Blocks US1, US5, US6)

- [ ] **T011** [FOUNDATION] Define complete database schema with Drizzle ORM
  - Create: `lib/db/schema.ts` with all 5 tables
  - Implement: `users`, `discord_links`, `bitcraft_links`, `api_keys`, `audit_logs`
  - Add: Indexes, constraints, foreign keys per data-model.md
  - Export: Type inference (`User`, `DiscordLink`, `BitCraftLink`, `ApiKey`, `AuditLog`)
  - Reference: data-model.md lines 64-600 for complete schema definitions
  - Files: `lib/db/schema.ts`

- [ ] **T012** [FOUNDATION] Create Drizzle database client instance
  - Create: `lib/db/index.ts` with connection pooling
  - Configure: Transaction mode with PgBouncer (`?pgbouncer=true`)
  - Export: `db` instance for use in Server Components and Server Actions
  - Reference: data-model.md lines 529-535 for connection setup
  - Files: `lib/db/index.ts`

- [ ] **T013** [FOUNDATION] Generate and apply initial database migration
  - Run: `pnpm db:push` to apply schema to local Supabase
  - Verify: Tables created successfully via Drizzle Studio (`pnpm db:studio`)
  - Document: Migration strategy in data-model.md lines 427-455
  - Files: `supabase/migrations/0000_initial_schema.sql` (if using db:generate)

### Authentication Framework (Blocks US1, US3)

- [ ] **T014** [P] [FOUNDATION] Create Supabase server-side client utilities
  - Create: `lib/supabase/server.ts` with cookie-based SSR client
  - Implement: `createClient()` function using `@supabase/ssr`
  - Reference: research.md lines 26-48 for implementation pattern
  - Files: `lib/supabase/server.ts`

- [ ] **T015** [P] [FOUNDATION] Create Supabase client-side client utilities
  - Create: `lib/supabase/client.ts` with browser client
  - Implement: `createBrowserClient()` for Client Components
  - Files: `lib/supabase/client.ts`

- [ ] **T016** [P] [FOUNDATION] Create middleware utilities for auth checks
  - Create: `lib/supabase/middleware.ts` with session helpers
  - Implement: `getSession()`, `requireAuth()` utilities
  - Files: `lib/supabase/middleware.ts`

- [ ] **T017** [FOUNDATION] Implement auth middleware in Next.js middleware
  - Update: `middleware.ts` to refresh Supabase Auth sessions
  - Add: Protected route patterns (e.g., `/profile`, `/admin`)
  - Add: Public route bypass (e.g., `/login`, `/api/health`)
  - Reference: plan.md lines 162, middleware structure
  - Files: `middleware.ts`

### API Infrastructure (Blocks US3, US6)

- [ ] **T018** [P] [FOUNDATION] Create Zod validation schemas
  - Create: `lib/validators/schemas.ts` with all input/output schemas
  - Implement: `linkBitCraftRequestSchema`, `linkBitCraftVerifySchema`
  - Implement: `createApiKeySchema`, `revokeApiKeySchema`
  - Reference: data-model.md lines 608-634, contracts/*.yaml
  - Files: `lib/validators/schemas.ts`

- [ ] **T019** [P] [FOUNDATION] Implement rate limiting utilities
  - Create: `lib/rate-limit/index.ts` with Upstash Ratelimit
  - Implement: `checkRateLimit(userId)` with 500 req/min per user
  - Implement: `withRateLimit()` middleware wrapper
  - Add: In-memory fallback for local development (no Redis)
  - Reference: research.md lines 256-320, spec.md FR-021
  - Files: `lib/rate-limit/index.ts`

- [ ] **T020** [P] [FOUNDATION] Create audit logging utilities
  - Create: `lib/audit/index.ts` with audit log helpers
  - Implement: `auditLog(data: AuditLogEntry)` function
  - Add: Action constants (e.g., `user.login`, `bitcraft.link_verified`)
  - Reference: data-model.md lines 332-424, audit log schema
  - Files: `lib/audit/index.ts`

- [ ] **T021** [P] [FOUNDATION] Implement API error handling utilities
  - Create: `lib/utils/errors.ts` with custom error classes
  - Implement: `ApiError`, `ValidationError`, `RateLimitError`, `AuthError`
  - Add: Standard error response formatter
  - Reference: contracts/auth.yaml error responses
  - Files: `lib/utils/errors.ts`

### Game Data Integration (Blocks US2)

- [ ] **T022** [P] [FOUNDATION] Create SpacetimeDB client wrapper
  - Create: `lib/spacetime/client.ts` with WebSocket connection
  - Implement: `GameDataClient` class with connection pooling
  - Add: Reconnection logic and error handling
  - Reference: research.md lines 62-133 for implementation pattern
  - Files: `lib/spacetime/client.ts`

- [ ] **T023** [P] [FOUNDATION] Implement game data caching layer
  - Create: `lib/spacetime/cache.ts` with category-specific TTLs
  - Implement: `DataCategory` enum (STATIC/SEMI_STATIC/DYNAMIC/REALTIME)
  - Implement: `TTL_CONFIG` with 24h/6h/1h/5min TTLs
  - Add: Cache invalidation and staleness detection
  - Reference: research.md lines 104-124, spec.md FR-013
  - Files: `lib/spacetime/cache.ts`

- [ ] **T024** [P] [FOUNDATION] Define game data TypeScript types
  - Create: `lib/spacetime/types.ts` with game entity types
  - Add: Placeholder types (will be replaced when SpacetimeDB schema available)
  - Files: `lib/spacetime/types.ts`

### API Mocking Infrastructure (Blocks US2, Enables Local Development)

- [ ] **T024a** [P] [FOUNDATION] Install MSW (Mock Service Worker)
  - Add: `msw` v2+ to devDependencies
  - Reference: research.md lines 704-900 for WebSocket mocking decision
  - Files: `package.json`

- [ ] **T024b** [P] [FOUNDATION] Create MSW setup structure
  - Create: `mocks/browser.ts` with worker setup for browser environment
  - Create: `mocks/server.ts` with server setup for Node.js/testing
  - Implement: Conditional initialization based on `ENABLE_API_MOCKING` env var
  - Reference: research.md lines 770-788
  - Files: `mocks/browser.ts`, `mocks/server.ts`

- [ ] **T024c** [P] [FOUNDATION] Create SpacetimeDB WebSocket mock handlers
  - Create: `mocks/spacetime/handlers.ts` with WebSocket connection mocking
  - Implement: Connection handshake simulation
  - Implement: Query/response message handlers
  - Create: `mocks/spacetime/data/` directory for mock game data (players, territories, economy)
  - Reference: research.md lines 716-765, for WebSocket protocol
  - Files: `mocks/spacetime/handlers.ts`, `mocks/spacetime/data/players.ts`, `mocks/spacetime/data/territories.ts`

- [ ] **T024d** [P] [FOUNDATION] Create BitCraft API REST mock handlers
  - Create: `mocks/bitcraft/handlers.ts` with HTTP endpoint mocking
  - Mock: `POST /request-access-code` endpoint (return success)
  - Mock: `POST /authenticate` endpoint (return mock JWT with player ID)
  - Implement: Mock JWT generator for testing
  - Reference: research.md lines 863-880
  - Files: `mocks/bitcraft/handlers.ts`

- [ ] **T024e** [P] [FOUNDATION] Create mock data scenarios
  - Create: `mocks/spacetime/scenarios/empty-world.ts` - No game data
  - Create: `mocks/spacetime/scenarios/active-game.ts` - Typical active game state
  - Create: `mocks/spacetime/scenarios/stress-test.ts` - High load data
  - Document: How to switch scenarios in development
  - Reference: research.md lines 846-861
  - Files: `mocks/spacetime/scenarios/*.ts`

- [ ] **T024f** [FOUNDATION] Integrate MSW with development workflow
  - Update: `lib/spacetime/client.ts` to use mock URI in test/dev mode
  - Add: Environment variable `ENABLE_API_MOCKING=true` to `.env.example`
  - Update: `next.config.js` to exclude MSW worker files from production build
  - Test: WebSocket mock interception works in dev mode
  - Reference: research.md lines 790-804
  - Files: `lib/spacetime/client.ts`, `.env.example`, `next.config.js`

### BitCraft API Integration (Blocks US1)

- [ ] **T025** [P] [FOUNDATION] Implement BitCraft verification API client
  - Create: `lib/bitcraft-api/verification.ts` with verification flow
  - Implement: `requestAccessCode(email)` - POST to trigger code
  - Implement: `verifyCode(email, code)` - POST to validate code (discard returned token)
  - Note: Player ID extraction deferred - JWT hex_identity/sub are not the player IDs we need
  - Add: Error handling (401/403 invalid code, 503 API unavailable)
  - Reference: research.md lines 138-252, quickstart.md lines 64-66
  - Files: `lib/bitcraft-api/verification.ts`

### UI Components (Blocks US1, US6)

- [ ] **T026** [P] [FOUNDATION] Create root layout with theme provider
  - Create: `app/layout.tsx` with metadata, fonts, ThemeProvider
  - Add: Dark mode toggle, global styles
  - Files: `app/layout.tsx`

- [ ] **T027** [P] [FOUNDATION] Create loading and error boundaries
  - Create: `app/loading.tsx` for global loading state
  - Create: `app/error.tsx` for global error boundary
  - Create: `app/not-found.tsx` for 404 page
  - Files: `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`

- [ ] **T028** [P] [FOUNDATION] Create auth route group layout
  - Create: `app/(auth)/layout.tsx` with auth required check
  - Implement: Server Component that redirects unauthenticated users
  - Files: `app/(auth)/layout.tsx`

- [ ] **T029** [P] [FOUNDATION] Create public route group layout
  - Create: `app/(public)/layout.tsx` for public pages
  - Files: `app/(public)/layout.tsx`

**Checkpoint**: ✅ Foundation complete - all user stories can now begin implementation

---

## Phase 3: User Story 1 - User Authentication & Three-Way Identity Linking (Priority: P1) 🎯 MVP

**Goal**: Enable users to authenticate via Discord OAuth, create platform profiles, and link their BitCraft player accounts via email verification

**Independent Test**:
1. Complete Discord OAuth flow → User profile created with platform ID and Discord link
2. Link BitCraft account → Email verification → Player ID stored
3. View profile → All three identities displayed (platform, Discord, BitCraft)

**Acceptance Criteria**: spec.md lines 30-36 (6 scenarios)

**Duration Estimate**: 8-12 hours

### Data Models for US1

- [ ] **T030** [US1] Verify users table exists and is accessible
  - Verify: Schema applied from T011 (users table exists)
  - Test: Insert test user record via Drizzle Studio
  - Reference: data-model.md lines 64-95

- [ ] **T031** [US1] Verify discord_links table exists with constraints
  - Verify: Schema applied from T011 (discord_links table exists)
  - Test: Insert test Discord link with foreign key to users
  - Reference: data-model.md lines 99-162

- [ ] **T032** [US1] Verify bitcraft_links table exists with uniqueness constraints
  - Verify: Schema applied from T011 (bitcraft_links table exists)
  - Test: Attempt duplicate email insert (should fail)
  - Reference: data-model.md lines 166-232

### API Endpoints for US1 (Authentication)

- [ ] **T033** [P] [US1] Implement health check endpoint
  - Create: `app/api/health/route.ts` with GET handler
  - Return: `{ status: "ok", timestamp, version }`
  - Reference: contracts/auth.yaml lines 320-341
  - Files: `app/api/health/route.ts`

- [ ] **T034** [P] [US1] Implement GET /api/auth/session endpoint
  - Create: `app/api/auth/session/route.ts` with session retrieval
  - Query: Supabase Auth session + Discord link + BitCraft link (3-way join)
  - Return: SessionResponse schema with all identities
  - Add: Rate limiting (500 req/min per user)
  - Add: Audit logging (`user.session_retrieved`)
  - Reference: contracts/auth.yaml lines 35-85
  - Files: `app/api/auth/session/route.ts`

- [ ] **T035** [US1] Implement POST /api/auth/link-bitcraft/request endpoint
  - Create: `app/api/auth/link-bitcraft/request/route.ts`
  - Validate: Email format with Zod schema
  - Check: Email not already linked (query bitcraft_links table)
  - Call: BitCraft API `requestAccessCode(email)`
  - Add: Rate limiting (3 req/hour per user)
  - Add: Audit logging (`bitcraft.link_requested`)
  - Return: Success message with instructions
  - Reference: contracts/auth.yaml lines 87-164, research.md lines 150-168
  - Files: `app/api/auth/link-bitcraft/request/route.ts`

- [ ] **T036** [US1] Implement POST /api/auth/link-bitcraft/verify endpoint
  - Create: `app/api/auth/link-bitcraft/verify/route.ts`
  - Validate: Email + code (6 digits) with Zod schema
  - Call: BitCraft API `verifyCode(email, code)` and discard returned token
  - Insert: New record in bitcraft_links table (email, user ID) - no player ID yet
  - Note: Player ID field deferred until WebSocket schema exploration determines correct retrieval method
  - Add: Rate limiting (10 req/hour per user, allows retries)
  - Add: Attempt tracking (max 3 failed attempts before requiring new code)
  - Add: Audit logging (`bitcraft.link_verified`)
  - Return: Success with BitCraftLink details (email only)
  - Reference: contracts/auth.yaml lines 166-242, research.md lines 170-206
  - Files: `app/api/auth/link-bitcraft/verify/route.ts`

- [ ] **T037** [P] [US1] Implement POST /api/auth/link-bitcraft/unlink endpoint
  - Create: `app/api/auth/link-bitcraft/unlink/route.ts`
  - Soft delete: Set `is_active = false`, `unlinked_at = now()`, `unlinked_reason`
  - Add: Audit logging (`bitcraft.unlinked`)
  - Return: Success message
  - Reference: contracts/auth.yaml lines 244-294
  - Files: `app/api/auth/link-bitcraft/unlink/route.ts`

- [ ] **T038** [P] [US1] Implement GET /api/auth/profile endpoint
  - Create: `app/api/auth/profile/route.ts`
  - Query: Same as /auth/session (all three identities)
  - Return: ProfileResponse (same shape as SessionResponse)
  - Reference: contracts/auth.yaml lines 296-318
  - Files: `app/api/auth/profile/route.ts`

### Server Actions for US1

- [ ] **T039** [P] [US1] Create auth Server Actions
  - Create: `app/actions/auth.ts` with sign out action
  - Implement: `signOut()` - Clear Supabase session, audit log, redirect
  - Implement: `refreshSession()` - Manually refresh Supabase session
  - Add: Audit logging (`user.logout`)
  - Files: `app/actions/auth.ts`

- [ ] **T040** [P] [US1] Create profile Server Actions
  - Create: `app/actions/profile.ts` with profile mutations
  - Implement: `linkBitCraft(email)` - Call API endpoint
  - Implement: `verifyBitCraft(email, code)` - Call API endpoint
  - Implement: `unlinkBitCraft(reason)` - Call API endpoint
  - Add: Form validation with Zod
  - Add: Optimistic updates with revalidation
  - Files: `app/actions/profile.ts`

### UI Components for US1

- [ ] **T041** [P] [US1] Create Discord login button component
  - Create: `components/auth/discord-login-button.tsx` (Client Component)
  - Implement: Click handler that redirects to Supabase Discord OAuth
  - Add: "use client" directive
  - Add: Loading state during redirect
  - Files: `components/auth/discord-login-button.tsx`

- [ ] **T042** [P] [US1] Create profile display component
  - Create: `components/auth/profile-display.tsx` (Server Component)
  - Query: Session data (platform, Discord, BitCraft identities)
  - Display: User ID, Discord username/avatar, BitCraft email/player ID
  - Add: "Unlink" button if BitCraft linked
  - Files: `components/auth/profile-display.tsx`

- [ ] **T043** [P] [US1] Create BitCraft linking form component
  - Create: `components/auth/bitcraft-link-form.tsx` (Client Component)
  - Implement: Two-step form (email → code)
  - Add: Client-side validation with Zod
  - Add: Loading states, error messages
  - Call: Server Actions from T040
  - Files: `components/auth/bitcraft-link-form.tsx`

### Pages for US1

- [ ] **T044** [US1] Create login page
  - Create: `app/(public)/login/page.tsx`
  - Add: DiscordLoginButton component
  - Add: Welcome message, instructions
  - Files: `app/(public)/login/page.tsx`

- [ ] **T045** [US1] Create OAuth callback handler
  - Create: `app/api/auth/callback/route.ts`
  - Handle: Discord OAuth redirect from Supabase
  - Create: User profile on first login (insert into users + discord_links tables)
  - Update: Discord link on subsequent logins (refresh username/avatar)
  - Add: Audit logging (`user.created`, `user.login`, `discord.refreshed`)
  - Redirect: To /profile after successful auth
  - Files: `app/api/auth/callback/route.ts`

- [ ] **T046** [US1] Create profile page with BitCraft linking
  - Create: `app/(auth)/profile/page.tsx` (Server Component)
  - Display: ProfileDisplay component showing all identities
  - Display: BitCraftLinkForm if not yet linked
  - Add: Sign out button
  - Files: `app/(auth)/profile/page.tsx`

- [ ] **T047** [US1] Create BitCraft linking sub-page
  - Create: `app/(auth)/profile/link-bitcraft/page.tsx`
  - Display: Detailed instructions for email verification flow
  - Display: BitCraftLinkForm component
  - Add: Back button to profile
  - Files: `app/(auth)/profile/link-bitcraft/page.tsx`

- [ ] **T048** [P] [US1] Create home page with login CTA
  - Create: `app/page.tsx` with welcome message
  - Add: Link to /login if not authenticated
  - Add: Link to /profile if authenticated
  - Files: `app/page.tsx`

### Integration for US1

- [ ] **T049** [US1] Test complete authentication flow end-to-end
  - Manual test: Discord OAuth → profile creation → session retrieval
  - Verify: User record, discord_links record, audit logs created
  - Verify: Session cookie set correctly, middleware refreshes session

- [ ] **T050** [US1] Test BitCraft linking flow end-to-end
  - Manual test: Request code → receive email → verify code → link stored
  - Verify: bitcraft_links record created with player ID
  - Verify: Profile page displays BitCraft identity
  - Verify: Audit logs for link_requested and link_verified

- [ ] **T051** [US1] Test error handling for BitCraft linking
  - Test: Invalid email format → validation error
  - Test: Email already linked → error message
  - Test: Invalid verification code → attempts tracking
  - Test: BitCraft API unavailable → 503 error with retry message

**Checkpoint**: ✅ User Story 1 COMPLETE - Users can authenticate and link all three identities independently

---

## Phase 4: User Story 2 - Game Data API Integration Layer (Priority: P2)

**Goal**: Establish a reliable connection to the SpacetimeDB game data API with category-specific caching, graceful degradation when API unavailable, and admin-configurable API key access control for pilot phase

**Independent Test**:
1. Query game data endpoint → Data fetched from SpacetimeDB and cached
2. Query again before TTL expiry → Served from cache (fast)
3. Disconnect SpacetimeDB → Stale cached data served with staleness indicator
4. Reconnect SpacetimeDB → Fresh data fetched after TTL expiry

**Acceptance Criteria**: spec.md lines 48-55 (6 scenarios)

**Duration Estimate**: 6-8 hours

### Data Models for US2

- [ ] **T052** [US2] Add cache metadata to GameDataClient
  - Update: `lib/spacetime/client.ts` with in-memory Map cache
  - Add: `CacheEntry` type with `{ data, fetchedAt, category }`
  - Add: Cache statistics (hit rate, miss rate, stale serves)
  - Reference: research.md lines 77-118

### Services for US2

- [ ] **T053** [US2] Implement SpacetimeDB connection management
  - Update: `GameDataClient` with persistent WebSocket connection
  - Implement: `connect()` method with retry logic
  - Implement: `disconnect()` and `reconnect()` methods
  - Add: Connection state tracking (CONNECTING, CONNECTED, DISCONNECTED, RECONNECTING)
  - Add: Automatic reconnection with exponential backoff
  - Reference: research.md lines 72-102

- [ ] **T054** [US2] Implement category-specific caching logic
  - Update: `lib/spacetime/cache.ts` with TTL expiry checks
  - Implement: `isExpired(entry, category)` function
  - Implement: `shouldServeStale(entry)` function (API unavailable case)
  - Add: Cache eviction policy (LRU if cache size exceeds threshold)
  - Reference: spec.md FR-013, research.md lines 106-118

- [ ] **T055** [US2] Implement query method with caching
  - Implement: `query<T>(category, queryParams)` method in GameDataClient
  - Add: Cache key generation from query parameters
  - Add: Cache lookup before SpacetimeDB query
  - Add: Cache write after successful fetch
  - Add: Staleness indicator in response when serving stale
  - Reference: research.md lines 84-102

- [ ] **T056** [US2] Implement exponential backoff for rate limiting
  - Add: Retry logic when SpacetimeDB returns rate limit errors
  - Implement: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Add: Circuit breaker pattern (stop retrying after N failures)
  - Reference: spec.md FR-017

### API Endpoints for US2

- [ ] **T057** [P] [US2] Create game data proxy endpoint (placeholder)
  - Create: `app/api/game-data/route.ts` with GET handler
  - Implement: Query SpacetimeDB via GameDataClient
  - Add: API key validation (pilot phase gate)
  - Add: Rate limiting (500 req/min per user)
  - Return: Game data with freshness timestamp
  - Note: Actual game queries will be feature-specific (future work)
  - Files: `app/api/game-data/route.ts`

### Integration for US2

- [ ] **T058** [US2] Test SpacetimeDB connection and caching
  - Manual test: Query data → verify fetched from SpacetimeDB
  - Verify: Cache hit on second query (before TTL expiry)
  - Verify: Cache miss after TTL expiry (fresh fetch)

- [ ] **T059** [US2] Test graceful degradation when SpacetimeDB unavailable
  - Simulate: Disconnect SpacetimeDB (stop local instance or mock unavailable)
  - Manual test: Query data → verify stale cache served
  - Verify: Response includes staleness indicator
  - Verify: Error logged for debugging

- [ ] **T060** [US2] Test exponential backoff on rate limit errors
  - Simulate: SpacetimeDB rate limit response (mock or trigger limit)
  - Verify: Client retries with increasing delays
  - Verify: Circuit breaker stops retrying after threshold

**Checkpoint**: ✅ User Story 2 COMPLETE - Game data integration layer operational with caching and resilience

---

## Phase 5: User Story 3 - RESTful API Architecture (Priority: P3)

**Goal**: Establish consistent API patterns (authentication, rate limiting, pagination, error handling) that all future features will follow, enabling both web UI and Discord bot to access functionality through standardized interfaces

**Independent Test**:
1. Call protected endpoint without auth → 401 Unauthorized
2. Call endpoint with valid auth → 200 OK with data
3. Exceed rate limit → 429 Too Many Requests with retry-after header
4. Request paginated list → Verify pagination metadata
5. Trigger validation error → 400 Bad Request with field-level errors

**Acceptance Criteria**: spec.md lines 67-73 (6 scenarios)

**Duration Estimate**: 4-6 hours

### API Infrastructure for US3

- [ ] **T061** [P] [US3] Create API route handler utilities
  - Create: `lib/api/handler.ts` with standard handler wrapper
  - Implement: `withAuth(handler)` - Require authentication
  - Implement: `withRateLimit(handler)` - Apply rate limiting
  - Implement: `withValidation(schema, handler)` - Zod validation
  - Reference: research.md lines 292-310

- [ ] **T062** [P] [US3] Implement pagination utilities
  - Create: `lib/api/pagination.ts` with pagination helpers
  - Implement: `parsePaginationParams(request)` - Extract page, limit from query
  - Implement: `buildPaginationResponse(data, page, limit, total)` - Standard format
  - Add: Pagination metadata (page, limit, total, totalPages)
  - Reference: spec.md FR-023

- [ ] **T063** [P] [US3] Standardize error response format
  - Update: `lib/utils/errors.ts` with standard error response builder
  - Implement: `toErrorResponse(error)` - Convert any error to standard format
  - Add: Error codes (UNAUTHORIZED, VALIDATION_ERROR, RATE_LIMIT_EXCEEDED, etc.)
  - Reference: contracts/auth.yaml error schemas lines 496-516

- [ ] **T064** [P] [US3] Add CORS headers for API routes
  - Create: `lib/api/cors.ts` with CORS middleware
  - Implement: `withCors(handler)` - Add CORS headers
  - Configure: Allowed origins (web UI, approved clients)
  - Reference: spec.md FR-024

- [ ] **T065** [P] [US3] Implement request logging middleware
  - Create: `lib/api/logger.ts` with request/response logger
  - Implement: `withLogging(handler)` - Log request/response
  - Log: User ID, endpoint, parameters, response time, status code
  - Add: Error stack traces for 500 errors
  - Reference: spec.md FR-026

### API Endpoint Updates for US3

- [ ] **T066** [US3] Refactor existing endpoints to use standard patterns
  - Update: All API routes from US1 to use handler wrappers (T061)
  - Add: `withAuth()`, `withRateLimit()`, `withLogging()` to all protected endpoints
  - Ensure: Consistent error response format across all endpoints
  - Files: `app/api/auth/*/route.ts`, `app/api/game-data/route.ts`

- [ ] **T067** [P] [US3] Create API versioning structure
  - Rename: `app/api/` → `app/api/v1/` for version 1
  - Update: All endpoint imports and references
  - Document: Versioning strategy (URL-based `/api/v1/`, `/api/v2/`)
  - Reference: spec.md FR-025

### Documentation for US3

- [ ] **T068** [P] [US3] Document API conventions
  - Create: `docs/API_CONVENTIONS.md` with standard patterns
  - Document: Authentication, rate limiting, pagination, error handling
  - Add: Code examples for common patterns
  - Files: `docs/API_CONVENTIONS.md`

### Integration for US3

- [ ] **T069** [US3] Test authentication requirements
  - Test: Call protected endpoint without cookie → 401
  - Test: Call protected endpoint with valid session → 200
  - Test: Call protected endpoint with expired session → 401

- [ ] **T070** [US3] Test rate limiting enforcement
  - Test: Make 501 requests in 1 minute → 429 on 501st request
  - Verify: `Retry-After` header in 429 response
  - Verify: Rate limit resets after 1 minute

- [ ] **T071** [US3] Test error response consistency
  - Test: Trigger validation error → verify standard error format
  - Test: Trigger auth error → verify standard error format
  - Test: Trigger server error → verify standard error format (no stack trace exposed)

**Checkpoint**: ✅ User Story 3 COMPLETE - API architecture standardized and consistent across all endpoints

---

## Phase 6: User Story 4 - Discord Bot Integration Framework (Priority: P4)

**Goal**: Deploy a Discord bot that authenticates users via Discord ID, calls platform REST API endpoints, and formats responses appropriately for Discord's interface

**Independent Test**:
1. User with linked profile invokes `/profile` command → Bot displays profile data
2. User without linked profile invokes command → Bot provides linking instructions
3. Bot responds within 3 seconds (or shows "processing" indicator)
4. Multiple users invoke commands simultaneously → Each receives correct response

**Acceptance Criteria**: spec.md lines 85-92 (6 scenarios)

**Duration Estimate**: 6-8 hours

### Discord Bot Setup

- [ ] **T072** [P] [US4] Initialize Discord bot project
  - Create: `discord-bot/package.json` with discord.js dependency
  - Create: `discord-bot/tsconfig.json` for TypeScript compilation
  - Add scripts: `"start": "node dist/index.js"`, `"dev": "tsx watch index.ts"`
  - Files: `discord-bot/package.json`, `discord-bot/tsconfig.json`

- [ ] **T073** [P] [US4] Create Discord bot entry point
  - Create: `discord-bot/index.ts` with bot initialization
  - Implement: Discord client with Guilds intent
  - Add: Login with bot token from environment
  - Add: Error handling and graceful shutdown
  - Reference: research.md lines 408-455
  - Files: `discord-bot/index.ts`

- [ ] **T074** [P] [US4] Create platform API client for bot
  - Create: `discord-bot/api-client.ts` with REST API wrapper
  - Implement: `getProfileByDiscordId(discordId)` method
  - Add: API key authentication header
  - Add: Error handling (404 not found, 500 server error)
  - Reference: research.md lines 417-429
  - Files: `discord-bot/api-client.ts`

### Discord Bot Commands

- [ ] **T075** [P] [US4] Register slash commands with Discord API
  - Create: `discord-bot/commands/index.ts` with command definitions
  - Define: `/profile` command (description: "View your BitCraft Nexus profile")
  - Register: Commands via Discord REST API on bot startup
  - Files: `discord-bot/commands/index.ts`

- [ ] **T076** [US4] Implement /profile command handler
  - Create: `discord-bot/commands/profile.ts` with command logic
  - Implement: Fetch profile via API client using Discord ID
  - Format: Response as Discord embed (title, fields for identities)
  - Handle: User not found → provide linking instructions with web URL
  - Handle: API errors → user-friendly error message
  - Add: Ephemeral message (only visible to user who invoked)
  - Reference: research.md lines 425-453
  - Files: `discord-bot/commands/profile.ts`

- [ ] **T077** [P] [US4] Create interaction handler
  - Create: `discord-bot/handlers/interaction.ts` with event handler
  - Implement: Route interactions to appropriate command handlers
  - Add: Defer reply for commands that take > 3 seconds
  - Add: Error handling and logging
  - Files: `discord-bot/handlers/interaction.ts`

### Platform API Endpoint for Discord Bot

- [ ] **T078** [P] [US4] Create endpoint to get profile by Discord ID
  - Create: `app/api/v1/users/by-discord/{discordId}/route.ts`
  - Query: User profile via discord_links table (join with users, bitcraft_links)
  - Require: API key authentication (bot uses its own key)
  - Return: Profile data (same format as /auth/profile)
  - Reference: spec.md FR-027
  - Files: `app/api/v1/users/by-discord/[discordId]/route.ts`

### Discord Bot Deployment

- [ ] **T079** [P] [US4] Create Discord bot environment template
  - Create: `discord-bot/.env.example` with required variables
  - Document: `DISCORD_BOT_TOKEN`, `PLATFORM_API_URL`, `BOT_API_KEY`
  - Files: `discord-bot/.env.example`

- [ ] **T080** [P] [US4] Document Discord bot setup
  - Create: `discord-bot/README.md` with setup instructions
  - Document: Creating Discord application, obtaining bot token
  - Document: Inviting bot to test server
  - Document: Running bot locally
  - Files: `discord-bot/README.md`

### Integration for US4

- [ ] **T081** [US4] Test Discord bot authentication via Discord ID
  - Manual test: Link profile on web → invoke `/profile` in Discord
  - Verify: Bot retrieves profile successfully via Discord ID
  - Verify: Response displays all three identities

- [ ] **T082** [US4] Test Discord bot error handling
  - Test: Invoke command without linked profile → verify linking instructions
  - Test: Simulate API error → verify user-friendly error message
  - Verify: Errors logged with technical details

- [ ] **T083** [US4] Test Discord bot performance
  - Test: Invoke command → verify response within 3 seconds
  - Test: Multiple users invoke commands simultaneously → verify no interference

**Checkpoint**: ✅ User Story 4 COMPLETE - Discord bot operational and calling platform APIs

---

## Phase 7: User Story 5 - Data Persistence Infrastructure (Priority: P5)

**Goal**: Provide database schemas, migrations, and access patterns that all future features will use for storing user profiles, preferences, and feature-specific data

**Independent Test**:
1. Insert user profile → Verify record created with timestamps
2. Update profile → Verify updated_at timestamp changes
3. Soft delete content → Verify record marked deleted (not removed)
4. Critical operation occurs → Verify audit log entry created
5. Run migration → Verify schema changes applied without data loss

**Acceptance Criteria**: spec.md lines 104-111 (6 scenarios)

**Duration Estimate**: 4-6 hours

### Database Infrastructure for US5

- [ ] **T084** [P] [US5] Create database migration script for production
  - Run: `pnpm db:generate` to create migration SQL from schema
  - Review: Generated SQL in `supabase/migrations/`
  - Rename: Migration file with descriptive name (e.g., `0000_initial_schema.sql`)
  - Commit: Both schema.ts and migration SQL
  - Reference: data-model.md lines 434-450

- [ ] **T085** [P] [US5] Implement soft delete utilities
  - Create: `lib/db/soft-delete.ts` with soft delete helpers
  - Implement: `softDelete(table, id)` - Set deleted_at timestamp
  - Implement: `restore(table, id)` - Clear deleted_at timestamp
  - Add: Query helpers that filter out soft-deleted records by default
  - Reference: data-model.md line 208 (bitcraft_links soft delete example)

- [ ] **T086** [P] [US5] Create database transaction utilities
  - Create: `lib/db/transaction.ts` with transaction helpers
  - Implement: `withTransaction(callback)` - Execute multiple operations atomically
  - Add: Rollback on error
  - Reference: spec.md FR-041

- [ ] **T087** [P] [US5] Implement audit logging for all critical operations
  - Update: All mutation endpoints/actions to call `auditLog()`
  - Add: Audit logs for profile creation, linking, unlinking, API key operations
  - Verify: Audit logs immutable (no UPDATE/DELETE operations)
  - Reference: data-model.md lines 382-390, spec.md FR-040

### Database Seeding for US5

- [ ] **T088** [P] [US5] Create development seed script
  - Create: `scripts/seed.ts` with test data generation
  - Seed: 1 test user, 1 Discord link, 1 BitCraft link, 2 API keys
  - Add script: `"db:seed": "tsx scripts/seed.ts"` to package.json
  - Reference: data-model.md lines 462-487
  - Files: `scripts/seed.ts`

- [ ] **T089** [P] [US5] Document production seed procedures
  - Create: `docs/DATABASE_SEEDING.md` with manual SQL instructions
  - Document: Creating admin API keys via Supabase SQL editor
  - Document: Data retention and deletion policies
  - Files: `docs/DATABASE_SEEDING.md`

### Database Monitoring for US5

- [ ] **T090** [P] [US5] Set up connection pool monitoring
  - Configure: Supabase dashboard alerts for connection pool exhaustion
  - Document: Scaling procedures if connections exceed limits
  - Reference: data-model.md lines 529-535

### Integration for US5

- [ ] **T091** [US5] Test database migrations
  - Test: Run `pnpm supabase:reset` (drop DB, reapply all migrations)
  - Verify: All tables created successfully
  - Verify: No data loss (seed data reapplied)

- [ ] **T092** [US5] Test soft delete operations
  - Test: Soft delete BitCraft link → verify is_active = false
  - Test: Query profile → verify soft-deleted link not returned by default
  - Test: Restore link → verify is_active = true

- [ ] **T093** [US5] Test atomic transactions
  - Test: Multi-table operation with error → verify rollback (no partial writes)
  - Test: Successful transaction → verify all records committed

**Checkpoint**: ✅ User Story 5 COMPLETE - Database infrastructure robust and migration-ready

---

## Phase 8: User Story 6 - API Key Management for Pilot Phase (Priority: P6)

**Goal**: Provide an API key management interface where admins can generate keys for approved clients, revoke keys if needed, and monitor usage

**Independent Test**:
1. Admin generates API key → Key displayed once, hash stored in DB
2. Client makes request with valid key → Request authenticated
3. Admin revokes key → Subsequent requests rejected with 401
4. Admin views usage dashboard → Metrics displayed per key (request counts, last used)

**Acceptance Criteria**: spec.md lines 123-130 (6 scenarios)

**Duration Estimate**: 6-8 hours

### API Key Infrastructure for US6

- [ ] **T094** [US6] Verify api_keys table exists with security constraints
  - Verify: Schema applied from T011 (api_keys table exists)
  - Test: Insert test API key with hash and prefix
  - Verify: Unique constraint on key_hash
  - Reference: data-model.md lines 236-322

- [ ] **T095** [P] [US6] Implement API key generation utilities
  - Create: `lib/api-keys/generate.ts` with key generation
  - Implement: `generateApiKey()` - Return { key, hash, prefix }
  - Format: `bcn_{64-char-hex}` (bcn = BitCraft Nexus)
  - Hash: SHA-256 (no salt needed, keys are high entropy)
  - Define: Permission scope types (super scopes: read/write/admin, fine-grained: read:profile, write:profile, read:game-data, write:bitcraft-link, admin:api-keys)
  - Implement: Scope validation and hierarchy checking
  - Reference: research.md lines 355-362, data-model.md lines 264-284 for permission scopes

- [ ] **T096** [P] [US6] Implement API key validation middleware
  - Create: `lib/api-keys/validate.ts` with validation logic
  - Implement: `validateApiKey(key)` - Hash key, query database, check active
  - Update: Usage tracking (last_used_at, usage_count) asynchronously
  - Return: API key metadata (permissions, rate limit overrides)
  - Reference: research.md lines 364-382

- [ ] **T097** [P] [US6] Add API key check to protected endpoints
  - Update: API route handler utilities from T061 to check pilot mode
  - If pilot mode enabled: Require API key validation
  - If pilot mode disabled: Bypass key validation (feature flag)
  - Reference: spec.md FR-012, FR-048

### Admin API Endpoints for US6

- [ ] **T098** [P] [US6] Implement GET /api/v1/admin/api-keys endpoint
  - Create: `app/api/v1/admin/api-keys/route.ts` with list handler
  - Require: Admin authentication (check user role or permissions)
  - Query: All API keys with pagination
  - Filter: Optional `active` query param (true/false)
  - Return: ApiKeysListResponse with keys and pagination
  - Reference: contracts/api-keys.yaml lines 29-108
  - Files: `app/api/v1/admin/api-keys/route.ts`

- [ ] **T099** [US6] Implement POST /api/v1/admin/api-keys endpoint (create key)
  - Update: `app/api/v1/admin/api-keys/route.ts` with POST handler
  - Validate: CreateApiKeyRequest schema (name, permissions)
  - Generate: New API key via `generateApiKey()`
  - Insert: Record in api_keys table with hash, prefix, permissions
  - Add: Audit logging (`api_key.created`)
  - Return: Full key ONCE in response (never shown again)
  - Reference: contracts/api-keys.yaml lines 110-180
  - Files: `app/api/v1/admin/api-keys/route.ts`

- [ ] **T100** [P] [US6] Implement GET /api/v1/admin/api-keys/{keyId} endpoint
  - Create: `app/api/v1/admin/api-keys/[keyId]/route.ts` with GET handler
  - Query: Specific API key by ID with usage statistics
  - Return: ApiKeyResponse with full details (except full key)
  - Reference: contracts/api-keys.yaml lines 182-215
  - Files: `app/api/v1/admin/api-keys/[keyId]/route.ts`

- [ ] **T101** [US6] Implement DELETE /api/v1/admin/api-keys/{keyId} endpoint (revoke)
  - Update: `app/api/v1/admin/api-keys/[keyId]/route.ts` with DELETE handler
  - Soft revoke: Set is_active = false, revoked_at, revoked_by, revoked_reason
  - Add: Audit logging (`api_key.revoked`)
  - Return: RevokeApiKeyResponse with success message
  - Reference: contracts/api-keys.yaml lines 217-279
  - Files: `app/api/v1/admin/api-keys/[keyId]/route.ts`

- [ ] **T102** [P] [US6] Implement GET /api/v1/admin/api-keys/{keyId}/usage endpoint
  - Create: `app/api/v1/admin/api-keys/[keyId]/usage/route.ts`
  - Query: Usage statistics (total requests, requests by date, by endpoint)
  - Filter: Optional date range (startDate, endDate)
  - Return: ApiKeyUsageResponse with detailed metrics
  - Note: Future work - track requests in separate table for detailed analytics
  - Reference: contracts/api-keys.yaml lines 281-349
  - Files: `app/api/v1/admin/api-keys/[keyId]/usage/route.ts`

### Admin Server Actions for US6

- [ ] **T103** [P] [US6] Create admin Server Actions
  - Create: `app/actions/admin.ts` with API key management actions
  - Implement: `createApiKey(data)` - Call POST endpoint
  - Implement: `revokeApiKey(keyId, reason)` - Call DELETE endpoint
  - Add: Admin role check (only admins can access)
  - Files: `app/actions/admin.ts`

### Admin UI for US6

- [ ] **T104** [P] [US6] Create API key list component
  - Create: `components/admin/api-key-list.tsx` (Server Component)
  - Query: All API keys via API endpoint
  - Display: Table with name, prefix, permissions, status, usage count, last used
  - Add: Revoke button per key
  - Files: `components/admin/api-key-list.tsx`

- [ ] **T105** [P] [US6] Create API key creation form
  - Create: `components/admin/api-key-form.tsx` (Client Component)
  - Implement: Form with name, description, permissions (scopes checkboxes)
  - Validate: Zod schema client-side
  - Call: createApiKey Server Action on submit
  - Display: Full key ONCE after creation (modal with copy button)
  - Files: `components/admin/api-key-form.tsx`

- [ ] **T106** [US6] Create admin dashboard page
  - Create: `app/(auth)/admin/api-keys/page.tsx`
  - Display: ApiKeyList component
  - Display: ApiKeyForm component
  - Require: Admin authentication (check role in Server Component)
  - Files: `app/(auth)/admin/api-keys/page.tsx`

- [ ] **T107** [P] [US6] Create API key detail page
  - Create: `app/(auth)/admin/api-keys/[keyId]/page.tsx`
  - Display: Full API key details (name, description, permissions, timestamps)
  - Display: Usage statistics (chart of requests over time)
  - Add: Revoke button
  - Files: `app/(auth)/admin/api-keys/[keyId]/page.tsx`

### Integration for US6

- [ ] **T108** [US6] Test API key generation and validation
  - Test: Generate key → verify full key returned, hash stored in DB
  - Test: Make request with valid key → verify authenticated
  - Test: Make request with invalid key → verify 401 Unauthorized

- [ ] **T109** [US6] Test API key revocation
  - Test: Revoke key → verify is_active = false
  - Test: Make request with revoked key → verify 401 Unauthorized
  - Verify: Audit log for api_key.revoked

- [ ] **T110** [US6] Test pilot mode feature flag
  - Test: Enable pilot mode → verify key required
  - Test: Disable pilot mode → verify key not required
  - Reference: spec.md FR-048

**Checkpoint**: ✅ User Story 6 COMPLETE - API key management operational for pilot phase

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, documentation, and final validation

**Duration Estimate**: 4-6 hours

### Documentation

- [ ] **T111** [P] [POLISH] Create comprehensive README
  - Update: Root `README.md` with project overview
  - Add: Features list (authentication, game data, Discord bot, API keys)
  - Add: Link to quickstart.md for setup
  - Add: Link to docs/ for detailed guides
  - Files: `README.md`

- [ ] **T112** [P] [POLISH] Create development workflow documentation
  - Create: `docs/DEVELOPMENT_WORKFLOW.md` with daily dev patterns
  - Document: Starting Supabase, running dev server, using Drizzle Studio
  - Document: Making schema changes, generating migrations
  - Files: `docs/DEVELOPMENT_WORKFLOW.md`

- [ ] **T113** [P] [POLISH] Create troubleshooting guide
  - Create: `docs/SETUP_TROUBLESHOOTING.md` with common issues
  - Document: Supabase not running, Discord OAuth failures, DB connection errors
  - Reference: quickstart.md lines 373-424
  - Files: `docs/SETUP_TROUBLESHOOTING.md`

- [ ] **T114** [P] [POLISH] Document database architecture
  - Create: `docs/DATABASE_ARCHITECTURE.md` with Supabase + Drizzle patterns
  - Document: Schema design, migration workflow, query patterns
  - Reference: data-model.md
  - Files: `docs/DATABASE_ARCHITECTURE.md`

- [ ] **T115** [P] [POLISH] Create Drizzle ORM guide
  - Create: `docs/DRIZZLE_GUIDE.md` with common patterns
  - Document: Queries, joins, transactions, type inference
  - Add: Code examples for common operations
  - Files: `docs/DRIZZLE_GUIDE.md`

### Code Quality

- [ ] **T116** [P] [POLISH] Add JSDoc comments to complex functions
  - Update: All utility functions with JSDoc comments
  - Document: Parameters, return types, examples
  - Focus: lib/bitcraft-api/, lib/spacetime/, lib/api-keys/

- [ ] **T117** [P] [POLISH] Refactor duplicated code
  - Identify: Common patterns across endpoints (auth checks, error handling)
  - Extract: Reusable utilities
  - Update: All endpoints to use shared utilities

- [ ] **T118** [P] [POLISH] Run linter and fix warnings
  - Run: `pnpm lint` to identify issues
  - Fix: All ESLint warnings and errors
  - Verify: No console.log in production code (use logger)

### Performance

- [ ] **T119** [P] [POLISH] Optimize database queries
  - Review: All Drizzle queries for N+1 problems
  - Add: Eager loading with joins where appropriate
  - Add: Indexes for frequently queried columns (if missing)

- [ ] **T120** [P] [POLISH] Add loading states and skeletons
  - Update: All async pages with loading.tsx
  - Add: Skeleton components for profile, admin dashboard
  - Use: Suspense boundaries for streaming

### Security

- [ ] **T121** [P] [POLISH] Security audit of API endpoints
  - Verify: All protected endpoints require authentication
  - Verify: Rate limiting applied to all user-facing endpoints
  - Verify: Input validation with Zod on all mutations
  - Verify: SQL injection prevention (Drizzle parameterized queries)
  - Verify: XSS prevention (React escapes by default)

- [ ] **T122** [P] [POLISH] Audit environment variables
  - Verify: All secrets in .env.local (not committed)
  - Verify: .env.example up to date with all required variables
  - Verify: No hardcoded secrets in code

### Final Validation

- [ ] **T123** [POLISH] Run quickstart.md validation
  - Follow: quickstart.md from scratch (fresh clone)
  - Test: All setup steps work correctly
  - Test: Discord OAuth, BitCraft linking, Discord bot commands
  - Fix: Any broken instructions or missing steps

- [ ] **T124** [POLISH] Verify all user stories are independently testable
  - Test: US1 independently → All authentication features work
  - Test: US2 independently → Game data caching works
  - Test: US3 independently → API patterns consistent
  - Test: US4 independently → Discord bot functional
  - Test: US5 independently → Database operations robust
  - Test: US6 independently → API key management operational

- [ ] **T125** [POLISH] Test cross-story integration
  - Test: Discord bot (US4) uses authentication (US1) and API patterns (US3)
  - Test: API key management (US6) uses database infrastructure (US5)
  - Test: All features work together seamlessly

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
   - Duration: 2-3 hours
   - Output: Project initialized, dependencies installed, structure created

2. **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
   - Duration: 4-6 hours
   - Output: Database schema, auth framework, API infrastructure, game data client ready
   - ⚠️ **CRITICAL**: No user story work can begin until this phase is 100% complete

3. **User Stories (Phase 3-8)**: All depend on Foundational phase completion
   - Can proceed **in parallel** if team has multiple developers
   - Or proceed **sequentially** in priority order (P1 → P2 → P3 → P4 → P5 → P6)
   - Each story is independently testable and deliverable

4. **Polish (Phase 9)**: Depends on desired user stories being complete
   - Duration: 4-6 hours
   - Recommended: After US1-US4 (core MVP)

### User Story Dependencies

```
FOUNDATIONAL (Phase 2)
         ↓
    ┌────┴────┬────────┬────────┬────────┬────────┐
    ↓         ↓        ↓        ↓        ↓        ↓
   US1       US2      US3      US4      US5      US6
  (Auth)  (GameData) (API)   (Discord) (DB)  (APIKeys)
    ↓         ↓        ↓        ↓        ↓        ↓
    └─────────┴────────┴────────┴────────┴────────┘
                       ↓
                   POLISH
```

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P2)**: Can start after Foundational - Independent of US1
- **US3 (P3)**: Can start after Foundational - Refactors US1/US2 endpoints but doesn't break them
- **US4 (P4)**: Depends on US1 (needs auth endpoints), US3 (uses API patterns)
- **US5 (P5)**: Independent - Formalizes DB practices used in US1
- **US6 (P6)**: Depends on US3 (uses API patterns), integrates with all stories

**Recommendation**: Implement in priority order (P1→P2→P3→P4→P5→P6) for incremental delivery

### Within Each User Story

For any user story phase:
1. Data models (verify tables exist from Foundation)
2. Services (business logic)
3. API endpoints (HTTP handlers)
4. Server Actions (mutations)
5. UI components (presentation)
6. Pages (routing)
7. Integration testing (manual tests per acceptance criteria)

### Parallel Opportunities

**Within Setup (Phase 1)**: All tasks marked [P] can run simultaneously
- T001 (init Next.js) || T002 (install deps) || T003 (shadcn) || T004 (ESLint) || T005 (directories) || T006 (env) || T007 (Supabase) || T008 (Drizzle) || T009 (middleware) || T010 (Tailwind)

**Within Foundational (Phase 2)**: Many tasks marked [P] can run simultaneously
- T014-T016 (Supabase clients) || T018-T021 (API utils) || T022-T024 (SpacetimeDB) || T025 (BitCraft) || T026-T029 (UI)

**Across User Stories**: All user stories can be worked on in parallel by different team members after Foundation complete

**Within User Stories**: Tasks marked [P] within each story (e.g., API endpoints, UI components)

---

## Parallel Execution Examples

### Setup Phase (All at once)
```bash
# Developer 1:
Task: "Initialize Next.js 15 project" (T001)
Task: "Install core dependencies" (T002)

# Developer 2:
Task: "Install shadcn/ui" (T003)
Task: "Configure ESLint, Prettier" (T004)

# Developer 3:
Task: "Create project directory structure" (T005)
Task: "Configure environment variables template" (T006)
```

### Foundational Phase (Parallel groups)
```bash
# Developer 1: Database
Task: "Define complete database schema" (T011)
Task: "Create Drizzle database client" (T012)
Task: "Generate and apply initial migration" (T013)

# Developer 2: Authentication
Task: "Create Supabase server-side client" (T014)
Task: "Create Supabase client-side client" (T015)
Task: "Create middleware utilities" (T016)

# Developer 3: API Infrastructure
Task: "Create Zod validation schemas" (T018)
Task: "Implement rate limiting utilities" (T019)
Task: "Create audit logging utilities" (T020)
Task: "Implement API error handling" (T021)
```

### User Story 1 (Parallel within story)
```bash
# API Endpoints (all [P]):
Task: "Implement health check endpoint" (T033)
Task: "Implement GET /api/auth/session" (T034)
Task: "Implement POST /api/auth/link-bitcraft/unlink" (T037)
Task: "Implement GET /api/auth/profile" (T038)

# Server Actions (all [P]):
Task: "Create auth Server Actions" (T039)
Task: "Create profile Server Actions" (T040)

# UI Components (all [P]):
Task: "Create Discord login button" (T041)
Task: "Create profile display component" (T042)
Task: "Create BitCraft linking form" (T043)
```

### Multiple Stories (Parallel across stories)
```bash
# Developer Team A: US1 (Auth) - Priority 1
Team A implements all of Phase 3 (US1)

# Developer Team B: US2 (Game Data) - Priority 2
Team B implements all of Phase 4 (US2)

# Developer Team C: US3 (API Standards) - Priority 3
Team C implements all of Phase 5 (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Recommended for Solo Developer

**Goal**: Ship working authentication as fast as possible

1. **Day 1**: Complete Setup (Phase 1) + Foundational (Phase 2)
   - 6-9 hours total
   - Deliverable: Project runs, database connected, infrastructure ready

2. **Day 2-3**: Complete User Story 1 (Phase 3)
   - 8-12 hours total
   - Deliverable: Users can authenticate, link BitCraft accounts, view profiles

3. **Validation**: Test User Story 1 independently
   - All 6 acceptance scenarios from spec.md
   - Manual testing per quickstart.md

4. **Deploy**: Push MVP to production (if ready)
   - User authentication fully functional
   - Platform usable for early adopters

5. **Iterate**: Add US2, US3, US4, US5, US6 incrementally

### Incremental Delivery - Recommended for Team

**Goal**: Deliver value progressively, validate each increment

1. **Sprint 1**: Setup + Foundation → Infrastructure ready
   - Duration: 1 week
   - Team works together on Phase 1-2

2. **Sprint 2**: User Story 1 → MVP deployed
   - Duration: 1 week
   - Output: Authentication working, users can link accounts
   - **DEMO to stakeholders**

3. **Sprint 3**: User Story 2 + User Story 3 → Enhanced APIs
   - Duration: 1-2 weeks
   - Output: Game data integrated, API standards established
   - **DEMO incremental features**

4. **Sprint 4**: User Story 4 → Discord integration
   - Duration: 1 week
   - Output: Discord bot operational
   - **DEMO to community**

5. **Sprint 5**: User Story 5 + User Story 6 → Production ready
   - Duration: 1-2 weeks
   - Output: Database production-ready, API keys managed
   - **PILOT LAUNCH**

### Parallel Team Strategy - For Larger Teams

**Goal**: Maximize velocity with multiple developers

1. **Week 1**: Entire team on Setup + Foundation
   - Critical that foundation is solid before splitting

2. **Week 2+**: Split into parallel tracks
   - **Track A (2 devs)**: US1 (Auth) → US4 (Discord Bot)
   - **Track B (2 devs)**: US2 (Game Data) → US5 (Database)
   - **Track C (1 dev)**: US3 (API Standards) → US6 (API Keys)

3. **Integration**: Stories merge weekly
   - Each story independently tested before merge
   - Integration testing after merge

4. **Polish**: Entire team on Phase 9 after all stories complete

---

## Task Summary

### Total Tasks: 131 tasks

### By Phase:
- **Phase 1 (Setup)**: 10 tasks | 2-3 hours
- **Phase 2 (Foundational)**: 25 tasks | 6-8 hours | **BLOCKS ALL USER STORIES**
- **Phase 3 (US1 - Auth)**: 21 tasks | 8-12 hours | 🎯 **MVP**
- **Phase 4 (US2 - Game Data)**: 9 tasks | 6-8 hours
- **Phase 5 (US3 - API Standards)**: 11 tasks | 4-6 hours
- **Phase 6 (US4 - Discord Bot)**: 12 tasks | 6-8 hours
- **Phase 7 (US5 - Database)**: 10 tasks | 4-6 hours
- **Phase 8 (US6 - API Keys)**: 17 tasks | 6-8 hours
- **Phase 9 (Polish)**: 15 tasks | 4-6 hours

### Parallelizable Tasks: 68 tasks marked [P] (54% of total)

### Critical Path:
Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → Polish (Phase 9)
**Minimum time to MVP**: 14-21 hours (assuming solo developer)

### Independent User Stories:
After Foundation complete, all user stories can theoretically proceed in parallel if team capacity allows.

---

## Notes

- **[P] tasks**: Different files, no dependencies within phase - can run in parallel
- **[Story] labels**: Map tasks to specific user stories for traceability
- **Checkpoints**: Stop points to validate story completion independently
- **Manual testing**: No automated tests per constitution Principle VII - manual test procedures in quickstart.md
- **Commit strategy**: Commit after each task or logical group of tasks
- **Environment setup**: Reference quickstart.md for detailed setup instructions
- **External dependencies**: BitCraft API docs, SpacetimeDB credentials, Discord app setup (see spec.md Dependencies section)

---

**Generated by**: `/speckit.tasks` command
**Last updated**: 2025-10-13
**Status**: Ready for implementation 🚀

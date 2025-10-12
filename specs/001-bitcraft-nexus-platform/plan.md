# Implementation Plan: BitCraft Nexus Platform Infrastructure

**Branch**: `001-bitcraft-nexus-platform` | **Date**: 2025-10-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-bitcraft-nexus-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build the foundational infrastructure for BitCraft Nexus, a unified Next.js web application that consolidates BitCraft community tools. This phase establishes:

1. **Three-way identity system**: Discord OAuth (via Supabase Auth) + BitCraft player ID linking + platform profile
2. **Game data integration layer**: Websocket connection to SpacetimeDB with category-specific caching (24h/6h/1h/5min TTLs)
3. **RESTful API architecture**: Authentication endpoints, rate limiting (500 req/min per user), pilot-phase API key management
4. **Discord bot framework**: Command interface over REST API endpoints
5. **Data persistence**: Supabase PostgreSQL with Drizzle ORM for type-safe operations

**Technical Approach**: Next.js 15 App Router with Server Components, progressive API endpoint creation (on-demand for UI features), deferred observability/scaling (pilot-first), HTTPS-only token security without additional encryption layers.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode), Node.js 20+
**Primary Dependencies**: Next.js 15+, React 19 (Server Components), Supabase JS SDK, Drizzle ORM, SpacetimeDB SDK, discord.js, shadcn/ui, Radix UI, Tailwind CSS 4
**Storage**: PostgreSQL via Supabase (minimal app data: user profiles, identity links, API keys, audit logs only), SpacetimeDB (third-party game database, read-only via websocket, cached locally)
**Testing**: Vitest (deferred for pilot), manual testing procedures documented, Playwright (future E2E)
**Target Platform**: Web (modern evergreen browsers: Chrome, Firefox, Safari, Edge within last 2 years), Node.js server runtime (Vercel or compatible)
**Project Type**: Web application (full-stack Next.js with API routes)
**Performance Goals**:
- Page load < 3s (95th percentile)
- API responses < 500ms (95th percentile)
- 500 concurrent users without degradation
- Discord bot responses < 3s (95th percentile)
- Cache hit rate > 95% for game data

**Constraints**:
- HTTPS-only (no HTTP fallback)
- API rate limit: 500 requests/minute per authenticated user
- Discord API limits: 50 req/sec per server
- Pilot phase: API key-based access control
- No realtime features in scope (defer WebSocket subscriptions)
- Minimal logging (console + audit table, defer structured observability)

**Scale/Scope**:
- Pilot phase: 1000-5000 users
- 6 foundational user stories (P1-P6)
- Infrastructure-only (no feature UIs yet, just authentication + API foundation)
- Progressive API endpoint creation (build endpoints on-demand for future features)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Developer Experience First (DX) ✅
- **Onboarding automation**: Setup scripts will handle Supabase init, environment generation, pnpm dependencies
- **Type safety**: Full TypeScript strict mode, Drizzle ORM for database type safety
- **Hot reloading**: Next.js dev server provides instant feedback
- **Command aliases**: Standard Next.js + Drizzle commands (`pnpm dev`, `pnpm db:push`, `pnpm db:studio`)

### II. Type Safety & Validation ✅
- **Database schema in TypeScript**: Drizzle schema definitions (no raw SQL for schema)
- **ORM type checking**: All queries use Drizzle with compile-time types
- **API validation**: Server Actions will validate inputs with type-safe schemas
- **No `any` types**: Strict TypeScript configuration enforced
- **Inferred types**: Export and use `InferSelectModel`, `InferInsertModel` from schemas

### III. Modern Full-Stack Patterns ✅
- **Server Components default**: Database queries only in Server Components/Actions/Route Handlers
- **Client Components minimal**: Only for interactive elements (Discord OAuth button, form interactions)
- **Server Actions for mutations**: Profile linking, API key management use Server Actions with revalidation
- **Supabase for auth**: Discord OAuth via Supabase Auth with SSR cookies
- **Drizzle for data**: All app database operations (user profiles, audit logs)
- **Middleware auth only**: Session refresh in middleware, no business logic there

### IV. User Experience First (UX) ✅
- **Server-first rendering**: Minimize client JavaScript, leverage RSC
- **Loading states**: `loading.tsx` and Suspense boundaries for async operations
- **Error boundaries**: `error.tsx` for graceful error handling
- **Form validation**: Immediate feedback with progressive enhancement
- **Accessibility**: shadcn/ui components (accessible by default)
- **Dark mode**: `next-themes` without FOUC
- **Mobile-first**: Responsive design mandatory

### V. Automated Quality Gates ✅
- **Conventional Commits**: commitlint + husky hooks enforced
- **TypeScript compilation**: Must compile without errors before deployment
- **Migration discipline**: `db:push` for dev, `db:generate` for production migrations
- **Breaking changes**: Marked with `!` or `BREAKING CHANGE:` in commits

### VI. Documentation as Code ✅
- **Inline documentation**: Complex logic documented in code
- **Schema as docs**: Descriptive table/column names in Drizzle schemas
- **README maintenance**: Updated with setup procedures
- **Quick Start guide**: Created in Phase 1 (quickstart.md)
- **Troubleshooting docs**: Updated as issues discovered

### VII. Pragmatic Testing ⚠️ **DEFERRED**
- **Rationale**: Pilot-first approach prioritizes getting infrastructure working over test coverage
- **Manual testing**: Documented procedures for critical paths (auth flow, profile linking)
- **Type safety reduces need**: TypeScript + Drizzle prevent many runtime bugs
- **Future implementation**: Add tests for authentication and data mutations post-pilot when patterns stabilize

**Status**: All constitution principles satisfied or explicitly deferred with justification. No violations blocking implementation.

## Project Structure

### Documentation (this feature)

```
specs/001-bitcraft-nexus-platform/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── auth.yaml        # Authentication API endpoints
│   └── api-keys.yaml    # API key management endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Structure Decision**: Next.js App Router monolith with clear separation between Server Components, Client Components, and API routes. Following constitution file organization standards for Drizzle + Supabase + shadcn/ui integration.

```
bitcraft-nexus/
├── app/                           # Next.js 15 App Router
│   ├── (auth)/                    # Auth route group (layout with auth checks)
│   │   ├── profile/               # User profile & linking pages
│   │   │   ├── page.tsx           # Profile view (Server Component)
│   │   │   ├── link-bitcraft/     # BitCraft account linking
│   │   │   │   └── page.tsx       # Link form & verification
│   │   │   └── loading.tsx        # Loading state
│   │   └── layout.tsx             # Auth-required layout
│   ├── (public)/                  # Public route group
│   │   ├── login/                 # Discord OAuth login
│   │   │   └── page.tsx           # Login page (Client Component for button)
│   │   └── layout.tsx             # Public layout
│   ├── api/                       # API Route Handlers
│   │   ├── auth/                  # Auth endpoints
│   │   │   ├── callback/          # Discord OAuth callback
│   │   │   │   └── route.ts
│   │   │   ├── link-bitcraft/     # BitCraft linking endpoints
│   │   │   │   ├── request/route.ts    # POST trigger access code
│   │   │   │   └── verify/route.ts     # POST verify code
│   │   │   └── session/           # Session management
│   │   │       └── route.ts
│   │   ├── admin/                 # Admin-only endpoints (API key management)
│   │   │   └── api-keys/
│   │   │       └── route.ts
│   │   └── health/                # Health check endpoint
│   │       └── route.ts
│   ├── actions/                   # Server Actions (mutations)
│   │   ├── auth.ts                # Auth-related actions (sign out, refresh)
│   │   ├── profile.ts             # Profile update actions
│   │   └── admin.ts               # Admin actions (API key CRUD)
│   ├── layout.tsx                 # Root layout (theme provider, fonts)
│   ├── page.tsx                   # Home page
│   ├── loading.tsx                # Global loading state
│   ├── error.tsx                  # Global error boundary
│   └── not-found.tsx              # 404 page
│
├── components/
│   ├── ui/                        # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ...                    # Other shadcn components as needed
│   ├── auth/                      # Auth-specific components
│   │   ├── discord-login-button.tsx    # Client Component
│   │   ├── profile-display.tsx         # Server Component
│   │   └── bitcraft-link-form.tsx      # Client Component
│   ├── admin/                     # Admin-specific components
│   │   ├── api-key-list.tsx       # Server Component
│   │   └── api-key-form.tsx       # Client Component
│   └── providers/                 # Context providers
│       └── theme-provider.tsx     # Dark mode provider (Client Component)
│
├── lib/
│   ├── db/
│   │   ├── index.ts               # Drizzle client instance
│   │   └── schema.ts              # Database schema definitions (Drizzle)
│   ├── supabase/
│   │   ├── client.ts              # Browser client (Client Components)
│   │   ├── server.ts              # Server client (Server Components/Actions)
│   │   └── middleware.ts          # Auth middleware utilities
│   ├── spacetime/
│   │   ├── client.ts              # SpacetimeDB websocket client
│   │   ├── cache.ts               # Game data caching layer
│   │   └── types.ts               # Game data types
│   ├── bitcraft-api/
│   │   └── verification.ts        # BitCraft email verification API client
│   ├── rate-limit/
│   │   └── index.ts               # Rate limiting middleware (500/min per user)
│   ├── validators/
│   │   └── schemas.ts             # Zod schemas for input validation
│   └── utils.ts                   # Shared utilities (cn, formatters, etc.)
│
├── discord-bot/                   # Discord bot (separate process)
│   ├── index.ts                   # Bot entry point
│   ├── commands/                  # Slash commands
│   │   └── profile.ts             # Example: /profile command
│   ├── handlers/                  # Event handlers
│   │   └── interaction.ts
│   └── api-client.ts              # Client for calling platform REST API
│
├── middleware.ts                  # Next.js middleware (auth session refresh)
├── supabase/
│   ├── migrations/                # SQL migrations (generated by Drizzle)
│   └── config.toml                # Supabase local config
│
├── public/                        # Static assets
│   ├── favicon.ico
│   └── images/
│
├── docs/                          # Project documentation
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── QUICK_START.md
│   ├── DATABASE_ARCHITECTURE.md
│   ├── DRIZZLE_GUIDE.md
│   └── SETUP_TROUBLESHOOTING.md
│
├── scripts/                       # Automation scripts
│   └── setup.ts                   # Environment setup automation
│
├── .env.example                   # Environment template
├── .env.local                     # Local secrets (gitignored)
├── .gitignore
├── tsconfig.json                  # TypeScript config (strict mode)
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS 4 config
├── drizzle.config.ts              # Drizzle Kit config
├── components.json                # shadcn/ui config
├── package.json                   # Dependencies and scripts
└── pnpm-lock.yaml                 # Lock file
```

**Key Structural Decisions**:

1. **Route Groups**: `(auth)` and `(public)` for layout isolation without affecting URLs
2. **Server vs Client Components**: Default to Server, explicit `'use client'` only for interactivity
3. **Actions co-located**: Server Actions in `/app/actions/` for centralized mutations
4. **Discord bot separate**: Own directory, communicates via REST API (no shared code)
5. **Lib organization**: Clear separation (db, supabase, spacetime, validators, rate-limit)
6. **No tests/ directory yet**: Deferred per pragmatic testing principle, manual procedures documented

## Complexity Tracking

*No constitution violations requiring justification. Testing deferred is explicitly allowed by Principle VII (Pragmatic Testing).*

---

## Planning Status

**Phase 0 (Research)**: ✅ Complete
- [research.md](research.md) - All technical decisions documented and justified

**Phase 1 (Design & Contracts)**: ✅ Complete
- [data-model.md](data-model.md) - Complete database schema with Drizzle definitions
- [contracts/auth.yaml](contracts/auth.yaml) - Authentication API OpenAPI specification
- [contracts/api-keys.yaml](contracts/api-keys.yaml) - API key management OpenAPI specification
- [quickstart.md](quickstart.md) - Developer onboarding guide
- [CLAUDE.md](../../CLAUDE.md) - Updated agent context with stack information

**Phase 2 (Task Generation)**: 🔜 Pending
- Run `/speckit.tasks` to generate detailed implementation tasks
- Tasks will be ordered by dependencies and priority
- Each task will include acceptance criteria and testing procedures

---

## Next Steps

1. **Review Planning Artifacts**: Ensure all stakeholders agree with technical decisions
2. **Confirm External Dependencies**:
   - BitCraft verification API documentation
   - SpacetimeDB connection details and credentials
   - Discord application setup
3. **Run `/speckit.tasks`**: Generate ordered task list for implementation
4. **Begin Implementation**: Follow tasks in dependency order (authentication → game data → API → Discord bot)

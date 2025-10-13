# Implementation Plan: Workspace Restructuring

**Branch**: `001-i-need-to` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-i-need-to/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Convert existing Next.js application into a pnpm monorepo structure to support both the web application and a Discord integration bot, with shared database access and centralized schema management.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode), Node.js 20+  
**Primary Dependencies**: Next.js 15+ (App Router), Discord.js, Drizzle ORM, Supabase  
**Storage**: PostgreSQL via Supabase with centralized schema management  
**Testing**: Vitest (unit/integration), Playwright (E2E), Manual testing procedures  
**Target Platform**: Node.js server environment, Discord API integration  
**Project Type**: Monorepo (web application + Discord bot)  
**Performance Goals**: Independent build/deployment within 30 seconds, shared dependency updates under 2 minutes  
**Constraints**: Maintain 100% existing Next.js functionality, no breaking changes  
**Scale/Scope**: Multi-workspace monorepo with shared utilities and database access

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

✅ **I. Developer Experience First (DX)**
- Monorepo structure maintains existing `pnpm install` workflow
- Independent workspace commands preserve developer productivity
- Type-safe tooling (TypeScript, Drizzle) maintained across workspaces

✅ **II. Type Safety & Validation**
- Centralized schema management ensures type consistency
- Shared TypeScript configurations across workspaces
- Database-to-UI type safety maintained

✅ **III. Modern Full-Stack Patterns**
- Next.js App Router patterns preserved in web workspace
- Server Components remain default for web application
- Discord bot follows Node.js best practices

✅ **IV. User Experience First (UX)**
- No impact on existing web application UX
- Discord integration enhances user experience
- Performance goals defined (30s build, 2min updates)

✅ **V. Automated Quality Gates**
- Existing CI/CD pipeline functionality maintained
- Code quality metrics preserved across workspaces
- Conventional Commits discipline maintained

✅ **VI. Documentation as Code**
- Quick start guides updated for monorepo structure
- Workspace documentation co-located with code
- Setup procedures documented

✅ **VII. Pragmatic Testing**
- Testing capabilities unified across applications
- Critical paths (auth, data mutations) remain testable
- Manual testing procedures documented

### Technical Standards Compliance

✅ **Stack Requirements**
- Node.js 20+, TypeScript 5+, Next.js 15+ maintained
- PostgreSQL via Supabase preserved
- Drizzle ORM with centralized schema
- pnpm package manager (existing workspace)

✅ **Development vs Production**
- `pnpm db:push` for development iteration
- `pnpm db:generate` for production migrations
- Local Supabase instance maintained

**GATE RESULT**: ✅ PASS - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
bitcraft-nexus/
├── apps/
│   ├── web/                 # Next.js web application (moved from root)
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (routes)/    # Route groups
│   │   │   ├── api/         # Route handlers
│   │   │   └── actions.ts   # Server Actions
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   └── [feature]/   # Feature-specific components
│   │   ├── lib/
│   │   │   ├── supabase/    # Supabase client configuration
│   │   │   └── utils.ts     # Web-specific utilities
│   │   ├── tests/
│   │   └── package.json
│   └── discord-bot/         # Discord integration bot
│       ├── src/
│       │   ├── commands/    # Discord slash commands
│       │   ├── events/      # Discord event handlers
│       │   ├── handlers/    # Command handlers
│       │   └── index.ts     # Bot entry point
│       ├── tests/
│       └── package.json
├── packages/
│   ├── shared/              # Shared utilities and types
│   │   ├── src/
│   │   │   ├── utils/       # Common utility functions
│   │   │   ├── types/       # Shared TypeScript types
│   │   │   └── constants/   # Shared constants
│   │   ├── tests/
│   │   └── package.json
│   └── database/            # Centralized database schema
│       ├── schema/
│       │   ├── tables/      # Drizzle table definitions
│       │   └── index.ts     # Schema exports
│       ├── migrations/      # Generated migration files
│       ├── tests/
│       └── package.json
├── supabase/
│   ├── migrations/          # Generated SQL migrations
│   └── config.toml         # Supabase configuration
├── docs/                    # Project documentation
├── scripts/                 # Setup and automation scripts
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── package.json            # Root package.json
```

**Structure Decision**: Monorepo structure using pnpm workspaces with separate apps for web application and Discord bot, plus shared packages for common functionality and centralized database schema management.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

# Research: Workspace Restructuring

**Feature**: Workspace Restructuring  
**Date**: 2024-12-19  
**Purpose**: Document technical decisions and research findings for monorepo conversion

## Research Findings

### Monorepo Management Tool

**Decision**: Keep existing pnpm workspace (already configured)

**Rationale**: 
- Project already has `pnpm-workspace.yaml` configured
- pnpm provides excellent workspace support with dependency hoisting
- Maintains consistency with existing development workflow
- No migration overhead or learning curve

**Alternatives considered**:
- npm workspaces: Less mature workspace support, larger node_modules
- Lerna: Additional complexity, primarily for publishing packages
- Nx: Overkill for simple monorepo needs, adds significant overhead

### Discord Bot Architecture

**Decision**: Integration bot that connects Discord with the web app

**Rationale**:
- Provides seamless user experience between Discord and web platform
- Enables Discord users to interact with web app features
- Creates unified user journey across platforms
- Leverages existing web app functionality

**Alternatives considered**:
- Basic bot with slash commands: Limited functionality, standalone operation
- Full-featured bot: Complex moderation features not needed for integration
- Simple utility bot: Too basic for meaningful web app integration

### Data Integration Strategy

**Decision**: Shared database access (both apps connect to same DB)

**Rationale**:
- Ensures data consistency between Discord and web platforms
- Eliminates data synchronization complexity
- Leverages existing Supabase infrastructure
- Maintains single source of truth for user data

**Alternatives considered**:
- API communication: Adds latency, complexity, and potential inconsistency
- Message queue/event system: Overkill for direct integration needs
- Shared configuration files only: Insufficient for data sharing requirements

### Database Schema Management

**Decision**: Centralized schema management

**Rationale**:
- Ensures schema consistency across both applications
- Prevents schema drift between Discord bot and web app
- Leverages existing Drizzle ORM setup
- Maintains type safety from database to application

**Alternatives considered**:
- Shared schema package with migrations: More complex than centralized approach
- Each app manages its own schema: Risk of inconsistency and conflicts
- Copy schema files between apps: Manual process, error-prone

## Technical Implementation Notes

### Workspace Structure
- Root workspace contains shared packages and configuration
- `apps/web` for Next.js application (moved from root)
- `apps/discord-bot` for Discord integration bot
- `packages/shared` for common utilities and types
- `packages/database` for centralized schema and database utilities

### Dependency Management
- Root `package.json` manages workspace dependencies
- Individual workspace `package.json` files for app-specific dependencies
- Shared dependencies hoisted to root when possible
- Discord.js added as dependency for bot workspace

### Build and Deployment
- Independent build processes for each workspace
- Shared TypeScript configuration with workspace-specific overrides
- Unified testing across all workspaces
- Independent deployment pipelines maintained

### Database Integration
- Centralized Drizzle schema in `packages/database`
- Shared database client configuration
- Both applications use same Supabase instance
- Type-safe database access across all workspaces

## Research Validation

All technical decisions align with:
- Bitcraft Nexus Constitution principles
- Existing project architecture
- Performance requirements (30s build, 2min updates)
- Success criteria (100% functionality preservation)

No additional research required - all clarifications resolved through specification phase.

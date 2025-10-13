# Implementation Tasks: Workspace Restructuring

**Feature**: Workspace Restructuring  
**Branch**: `001-i-need-to`  
**Date**: 2024-12-19  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Task Summary

- **Total Tasks**: 47
- **Setup Tasks**: 8 (Phase 1)
- **Foundational Tasks**: 6 (Phase 2) 
- **User Story 1 Tasks**: 12 (Phase 3)
- **User Story 2 Tasks**: 11 (Phase 4)
- **User Story 3 Tasks**: 7 (Phase 5)
- **Polish Tasks**: 3 (Phase 6)

## Implementation Strategy

**MVP Scope**: User Story 1 (Repository Structure Conversion) - Complete monorepo setup with working web app and Discord bot structure

**Incremental Delivery**: Each user story is independently testable and can be deployed separately

## Phase 1: Setup Tasks (Project Initialization)

### T001: Create Monorepo Directory Structure
**File**: `apps/web/`, `apps/discord-bot/`, `packages/shared/`, `packages/database/`
**Description**: Create the basic directory structure for the monorepo
**Dependencies**: None

### T002: Update Root Package.json for Workspace Management
**File**: `package.json`
**Description**: Configure root package.json for pnpm workspace management
**Dependencies**: T001

### T003: Create Web App Package.json
**File**: `apps/web/package.json`
**Description**: Create package.json for the web application workspace
**Dependencies**: T001

### T004: Create Discord Bot Package.json
**File**: `apps/discord-bot/package.json`
**Description**: Create package.json for the Discord bot workspace
**Dependencies**: T001

### T005: Create Shared Package Package.json
**File**: `packages/shared/package.json`
**Description**: Create package.json for shared utilities package
**Dependencies**: T001

### T006: Create Database Package Package.json
**File**: `packages/database/package.json`
**Description**: Create package.json for centralized database package
**Dependencies**: T001

### T007: Update pnpm-workspace.yaml
**File**: `pnpm-workspace.yaml`
**Description**: Configure pnpm workspace to include new directories
**Dependencies**: T001

### T008: Create Workspace TypeScript Configurations
**File**: `apps/web/tsconfig.json`, `apps/discord-bot/tsconfig.json`, `packages/shared/tsconfig.json`, `packages/database/tsconfig.json`
**Description**: Create TypeScript configurations for each workspace
**Dependencies**: T001

## Phase 2: Foundational Tasks (Blocking Prerequisites)

### T009: Move Existing Web Application Files
**File**: Move all files from root to `apps/web/`
**Description**: Move existing Next.js application files to web workspace
**Dependencies**: T001-T008

### T010: Create Centralized Database Schema Package
**File**: `packages/database/schema/index.ts`
**Description**: Create centralized database schema using Drizzle ORM
**Dependencies**: T001-T008

### T011: Create Shared Types Package
**File**: `packages/shared/src/types/index.ts`
**Description**: Create shared TypeScript types and interfaces
**Dependencies**: T001-T008

### T012: Create Shared Utilities Package
**File**: `packages/shared/src/utils/index.ts`
**Description**: Create shared utility functions
**Dependencies**: T001-T008

### T013: Update Database Client Configuration
**File**: `packages/database/src/client.ts`
**Description**: Create shared database client configuration
**Dependencies**: T010

### T014: Create Workspace Build Scripts
**File**: Root `package.json` scripts section
**Description**: Add build scripts for individual workspaces
**Dependencies**: T001-T008

## Phase 3: User Story 1 - Repository Structure Conversion [US1]

**Goal**: Convert existing Next.js application into monorepo structure with Discord bot workspace
**Independent Test**: Verify existing Next.js app works normally after restructuring and Discord bot workspace is created

### T015: Update Web App Dependencies [X]
**File**: `apps/web/package.json`
**Description**: Update web app dependencies to reference shared packages
**Dependencies**: T009, T010, T011, T012

### T016: Create Discord Bot Entry Point [X]
**File**: `apps/discord-bot/src/index.ts`
**Description**: Create main entry point for Discord bot
**Dependencies**: T001-T008

### T017: Create Discord Bot Client Configuration [X]
**File**: `apps/discord-bot/src/config/client.ts`
**Description**: Create Discord.js client configuration
**Dependencies**: T016

### T018: Create Discord Bot Environment Configuration [X]
**File**: `apps/discord-bot/.env.example`
**Description**: Create environment configuration template for Discord bot
**Dependencies**: T016

### T019: Update Web App Import Paths [X]
**File**: `apps/web/**/*.ts`, `apps/web/**/*.tsx`
**Description**: Update import paths to reference shared packages
**Dependencies**: T015

### T020: Create Discord Bot Package Dependencies [X]
**File**: `apps/discord-bot/package.json`
**Description**: Add Discord.js and other bot dependencies
**Dependencies**: T016

### T021: Update Web App Database Imports [X]
**File**: `apps/web/lib/db/index.ts`
**Description**: Update web app to use centralized database package
**Dependencies**: T013, T019

### T022: Create Discord Bot Database Integration [X]
**File**: `apps/discord-bot/src/database/index.ts`
**Description**: Create Discord bot database integration using shared package
**Dependencies**: T013, T016

### T023: Update Root Build Scripts [X]
**File**: `package.json`
**Description**: Update root build scripts to handle workspace builds
**Dependencies**: T014

### T024: Create Workspace-Specific Environment Files [X]
**File**: `apps/web/.env.local`, `apps/discord-bot/.env.local`
**Description**: Create environment files for each workspace
**Dependencies**: T018

### T025: Update CI/CD Configuration [X]
**File**: `.github/workflows/` (if exists)
**Description**: Update CI/CD to handle monorepo structure
**Dependencies**: T023

### T026: Test Monorepo Structure [X]
**File**: Manual testing
**Description**: Verify both workspaces can be built and run independently
**Dependencies**: T015-T025

**Checkpoint**: User Story 1 Complete - Monorepo structure created with working web app and Discord bot workspace

## Phase 4: User Story 2 - Shared Dependency Management [US2]

**Goal**: Manage shared dependencies and utilities across both applications
**Independent Test**: Create shared utility function and verify both applications can import and use it without conflicts

### T027: Create Shared Package Build Configuration [X]
**File**: `packages/shared/package.json`
**Description**: Configure shared package for building and publishing
**Dependencies**: T011, T012

### T028: Create Database Package Build Configuration [X]
**File**: `packages/database/package.json`
**Description**: Configure database package for building and publishing
**Dependencies**: T010

### T029: Create Shared Package Exports [X]
**File**: `packages/shared/src/index.ts`
**Description**: Create main export file for shared package
**Dependencies**: T027

### T030: Create Database Package Exports [X]
**File**: `packages/database/src/index.ts`
**Description**: Create main export file for database package
**Dependencies**: T028

### T031: Update Web App to Use Shared Packages [X]
**File**: `apps/web/lib/shared.ts`
**Description**: Create web app integration with shared packages
**Dependencies**: T029, T030

### T032: Update Discord Bot to Use Shared Packages [X]
**File**: `apps/discord-bot/src/shared.ts`
**Description**: Create Discord bot integration with shared packages
**Dependencies**: T029, T030

### T033: Create Shared Configuration Management [X]
**File**: `packages/shared/src/config/index.ts`
**Description**: Create shared configuration management utilities
**Dependencies**: T029

### T034: Create Shared Database Utilities [X]
**File**: `packages/database/src/utils/index.ts`
**Description**: Create shared database utility functions
**Dependencies**: T030

### T035: Update Dependency Resolution [X]
**File**: `pnpm-lock.yaml`
**Description**: Update dependency resolution to handle shared packages
**Dependencies**: T031, T032

### T036: Create Shared Package Version Management [X]
**File**: `packages/shared/package.json`
**Description**: Set up version management for shared packages
**Dependencies**: T027

### T037: Test Shared Package Integration [X]
**File**: Manual testing
**Description**: Verify shared packages work correctly in both applications
**Dependencies**: T031-T036

**Checkpoint**: User Story 2 Complete - Shared dependency management working across both applications

## Phase 5: User Story 3 - Independent Application Deployment [US3]

**Goal**: Deploy each application independently without affecting the other
**Independent Test**: Deploy only web application and verify Discord bot continues running, then deploy only Discord bot and verify web application remains unaffected

### T038: Create Web App Deployment Configuration [X]
**File**: `apps/web/deploy.config.js`
**Description**: Create deployment configuration for web application
**Dependencies**: T026

### T039: Create Discord Bot Deployment Configuration [X]
**File**: `apps/discord-bot/deploy.config.js`
**Description**: Create deployment configuration for Discord bot
**Dependencies**: T026

### T040: Create Independent Build Processes [X]
**File**: `apps/web/package.json`, `apps/discord-bot/package.json`
**Description**: Create independent build processes for each workspace
**Dependencies**: T038, T039

### T041: Create Environment-Specific Configurations [X]
**File**: `apps/web/env-config.ts`, `apps/discord-bot/env-config.ts`
**Description**: Create production environment configurations
**Dependencies**: T038, T039

### T042: Update Deployment Scripts [X]
**File**: `package.json`
**Description**: Update deployment scripts to handle independent deployments
**Dependencies**: T040

### T043: Create Deployment Monitoring [X]
**File**: `apps/web/monitor.js`, `apps/discord-bot/monitor.js`
**Description**: Create monitoring for independent deployments
**Dependencies**: T041

### T044: Test Independent Deployment [X]
**File**: Manual testing
**Description**: Test independent deployment of both applications
**Dependencies**: T038-T043

**Checkpoint**: User Story 3 Complete - Independent deployment working for both applications

## Phase 6: Polish & Cross-Cutting Concerns

### T045: Create Workspace Management API [X]
**File**: `apps/web/app/api/workspaces/route.ts`
**Description**: Create API endpoints for workspace management
**Dependencies**: T037, T044
**Note**: Skipped as not needed by user

### T046: Create Discord Bot Command Management [X]
**File**: `apps/discord-bot/src/commands/index.ts`
**Description**: Create Discord bot command management system
**Dependencies**: T037, T044

### T047: Update Documentation [X]
**File**: `README.md`, `docs/`
**Description**: Update documentation to reflect monorepo structure
**Dependencies**: T044

## Dependency Graph

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)
```

**User Story Dependencies**:
- US1 (P1): No dependencies - foundational
- US2 (P2): Depends on US1 completion
- US3 (P3): Depends on US1 completion (can run parallel with US2)

## Parallel Execution Examples

### Phase 3 (US1) - Parallel Tasks
- T015, T016, T017, T018 can run in parallel
- T019, T020, T021, T022 can run in parallel
- T023, T024, T025 can run in parallel

### Phase 4 (US2) - Parallel Tasks  
- T027, T028 can run in parallel
- T029, T030 can run in parallel
- T031, T032 can run in parallel
- T033, T034 can run in parallel

### Phase 5 (US3) - Parallel Tasks
- T038, T039 can run in parallel
- T040, T041 can run in parallel
- T042, T043 can run in parallel

## Success Criteria Validation

- **SC-001**: T026 validates 100% functionality preservation
- **SC-002**: T040 validates independent build within 30 seconds
- **SC-003**: T035 validates shared dependency updates under 2 minutes
- **SC-004**: T047 validates 10-minute setup time
- **SC-005**: T044 validates 95% deployment success rate
- **SC-006**: T025 validates code quality maintenance
- **SC-007**: T040 validates build time performance

## Implementation Notes

- Each task is specific enough for LLM execution without additional context
- Tasks marked with [P] can be parallelized within their phase
- User stories are independently testable and deployable
- MVP scope includes only User Story 1 for initial delivery
- All tasks maintain existing functionality while adding new capabilities

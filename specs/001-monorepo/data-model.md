# Data Model: Workspace Restructuring

**Feature**: Workspace Restructuring  
**Date**: 2024-12-19  
**Purpose**: Define data entities and relationships for monorepo structure

## Core Entities

### Workspace

**Purpose**: Represents an independent application or package within the monorepo

**Attributes**:
- `name`: string (unique identifier)
- `type`: 'app' | 'package' (application vs shared package)
- `path`: string (relative path from monorepo root)
- `dependencies`: string[] (list of dependency names)
- `scripts`: Record<string, string> (npm scripts configuration)
- `config`: Record<string, any> (workspace-specific configuration)

**Relationships**:
- Contains multiple `BuildConfiguration` entities
- Depends on zero or more `SharedPackage` entities
- Uses `CentralizedSchema` for database access

**Validation Rules**:
- Name must be unique across all workspaces
- Path must be valid relative path from monorepo root
- Type must be either 'app' or 'package'

**State Transitions**:
- `created` → `configured` → `built` → `deployed`
- `deployed` → `updated` → `deployed`

### SharedPackage

**Purpose**: Represents common utilities, types, or configurations used across multiple workspaces

**Attributes**:
- `name`: string (package name)
- `version`: string (semantic version)
- `type`: 'utility' | 'config' | 'types' | 'database' (package category)
- `exports`: Record<string, string> (exported modules/paths)
- `dependencies`: string[] (external dependencies)
- `peerDependencies`: string[] (peer dependencies)

**Relationships**:
- Used by multiple `Workspace` entities
- May depend on `CentralizedSchema` (for database packages)

**Validation Rules**:
- Name must follow npm package naming conventions
- Version must be valid semantic version
- Exports must map to existing files

**State Transitions**:
- `created` → `published` → `deprecated` → `archived`

### BuildConfiguration

**Purpose**: Represents the settings and scripts needed to build, test, and deploy each workspace independently

**Attributes**:
- `workspaceId`: string (reference to Workspace)
- `buildCommand`: string (command to build the workspace)
- `testCommand`: string (command to run tests)
- `deployCommand`: string (command to deploy)
- `environment`: Record<string, string> (environment variables)
- `dependencies`: string[] (build-time dependencies)

**Relationships**:
- Belongs to one `Workspace` entity
- References `CentralizedSchema` for database builds

**Validation Rules**:
- Commands must be valid shell commands
- Environment variables must have valid names
- Dependencies must exist in package.json

**State Transitions**:
- `created` → `validated` → `active`
- `active` → `updated` → `active`

### CentralizedSchema

**Purpose**: Represents the unified database schema management system accessible to both web application and Discord bot

**Attributes**:
- `version`: string (schema version)
- `tables`: Record<string, TableDefinition> (database tables)
- `migrations`: Migration[] (schema migration history)
- `lastUpdated`: Date (last schema modification)
- `checksum`: string (schema integrity hash)

**Relationships**:
- Used by multiple `Workspace` entities
- Referenced by `BuildConfiguration` entities

**Validation Rules**:
- Version must be valid semantic version
- Tables must have valid Drizzle schema definitions
- Migrations must be in chronological order

**State Transitions**:
- `draft` → `validated` → `applied` → `migrated`
- `migrated` → `updated` → `migrated`

## Supporting Types

### TableDefinition
```typescript
interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}
```

### ColumnDefinition
```typescript
interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  constraints?: string[];
}
```

### IndexDefinition
```typescript
interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}
```

### ConstraintDefinition
```typescript
interface ConstraintDefinition {
  name: string;
  type: 'primary' | 'foreign' | 'unique' | 'check';
  columns: string[];
  references?: {
    table: string;
    column: string;
  };
}
```

### Migration
```typescript
interface Migration {
  id: string;
  version: string;
  up: string; // SQL for applying migration
  down: string; // SQL for rolling back migration
  appliedAt?: Date;
  checksum: string;
}
```

## Data Flow

### Schema Synchronization
1. `CentralizedSchema` defines database structure
2. Both web app and Discord bot workspaces import schema
3. Type-safe database access through Drizzle ORM
4. Schema changes propagate to all workspaces

### Dependency Resolution
1. `SharedPackage` entities define common functionality
2. `Workspace` entities declare dependencies on shared packages
3. pnpm resolves dependencies and hoists when possible
4. Build processes use resolved dependency graph

### Build Coordination
1. `BuildConfiguration` defines workspace-specific build steps
2. Independent build processes for each workspace
3. Shared packages built before dependent workspaces
4. Centralized schema available to all builds

## Validation Rules

### Cross-Entity Validation
- Workspace dependencies must reference existing SharedPackages
- BuildConfiguration must reference valid Workspace
- CentralizedSchema must be accessible to all Workspace entities

### Business Rules
- No circular dependencies between workspaces
- Schema changes must be backward compatible
- All workspaces must be buildable independently
- Shared packages must not depend on application-specific code

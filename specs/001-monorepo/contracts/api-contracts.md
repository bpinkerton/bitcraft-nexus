# API Contracts: Workspace Restructuring

**Feature**: Workspace Restructuring  
**Date**: 2024-12-19  
**Purpose**: Define API contracts for workspace management and Discord bot integration

## Workspace Management API

### GET /api/workspaces
**Purpose**: List all workspaces in the monorepo

**Response**:
```typescript
interface WorkspaceListResponse {
  workspaces: Workspace[];
  total: number;
}

interface Workspace {
  name: string;
  type: 'app' | 'package';
  path: string;
  status: 'active' | 'inactive' | 'building' | 'deploying';
  lastBuilt?: Date;
  dependencies: string[];
}
```

### POST /api/workspaces
**Purpose**: Create a new workspace

**Request**:
```typescript
interface CreateWorkspaceRequest {
  name: string;
  type: 'app' | 'package';
  template?: 'nextjs' | 'discord-bot' | 'shared-package';
  dependencies?: string[];
}
```

**Response**:
```typescript
interface CreateWorkspaceResponse {
  workspace: Workspace;
  success: boolean;
  message: string;
}
```

### GET /api/workspaces/{name}
**Purpose**: Get workspace details

**Response**:
```typescript
interface WorkspaceDetailsResponse {
  workspace: Workspace;
  buildConfig: BuildConfiguration;
  dependencies: SharedPackage[];
  recentBuilds: BuildLog[];
}
```

### POST /api/workspaces/{name}/build
**Purpose**: Build a specific workspace

**Response**:
```typescript
interface BuildResponse {
  buildId: string;
  status: 'started' | 'building' | 'success' | 'failed';
  logs: string[];
  duration?: number;
  error?: string;
}
```

## Shared Package API

### GET /api/packages
**Purpose**: List all shared packages

**Response**:
```typescript
interface PackageListResponse {
  packages: SharedPackage[];
  total: number;
}

interface SharedPackage {
  name: string;
  version: string;
  type: 'utility' | 'config' | 'types' | 'database';
  usedBy: string[]; // workspace names
  lastUpdated: Date;
}
```

### POST /api/packages
**Purpose**: Create a new shared package

**Request**:
```typescript
interface CreatePackageRequest {
  name: string;
  type: 'utility' | 'config' | 'types' | 'database';
  template?: 'utility' | 'config' | 'types' | 'database';
  dependencies?: string[];
}
```

### PUT /api/packages/{name}
**Purpose**: Update shared package

**Request**:
```typescript
interface UpdatePackageRequest {
  version?: string;
  dependencies?: string[];
  exports?: Record<string, string>;
}
```

## Database Schema API

### GET /api/schema
**Purpose**: Get current database schema

**Response**:
```typescript
interface SchemaResponse {
  version: string;
  tables: TableDefinition[];
  lastUpdated: Date;
  checksum: string;
}
```

### POST /api/schema/migrate
**Purpose**: Apply schema migrations

**Request**:
```typescript
interface MigrateRequest {
  migrations: string[]; // migration IDs
  dryRun?: boolean;
}
```

**Response**:
```typescript
interface MigrateResponse {
  success: boolean;
  appliedMigrations: string[];
  errors: string[];
  duration: number;
}
```

### GET /api/schema/status
**Purpose**: Check schema synchronization status

**Response**:
```typescript
interface SchemaStatusResponse {
  workspaces: {
    name: string;
    schemaVersion: string;
    inSync: boolean;
    lastChecked: Date;
  }[];
  overallStatus: 'synced' | 'out-of-sync' | 'error';
}
```

## Discord Bot Integration API

### POST /api/discord/webhook
**Purpose**: Handle Discord webhook events

**Request**:
```typescript
interface DiscordWebhookRequest {
  type: 'interaction' | 'message' | 'command';
  data: any; // Discord API payload
  signature: string;
  timestamp: string;
}
```

**Response**:
```typescript
interface DiscordWebhookResponse {
  success: boolean;
  response?: any; // Discord API response
  error?: string;
}
```

### GET /api/discord/commands
**Purpose**: List registered Discord commands

**Response**:
```typescript
interface DiscordCommandsResponse {
  commands: DiscordCommand[];
  total: number;
}

interface DiscordCommand {
  name: string;
  description: string;
  type: 'slash' | 'message' | 'user' | 'message';
  options?: CommandOption[];
  enabled: boolean;
}
```

### POST /api/discord/commands
**Purpose**: Register new Discord command

**Request**:
```typescript
interface RegisterCommandRequest {
  name: string;
  description: string;
  type: 'slash' | 'message' | 'user' | 'message';
  options?: CommandOption[];
  handler: string; // workspace.handler reference
}

interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'user' | 'channel';
  required?: boolean;
  choices?: { name: string; value: any }[];
}
```

## Build and Deployment API

### GET /api/builds
**Purpose**: List recent builds across all workspaces

**Response**:
```typescript
interface BuildsResponse {
  builds: BuildLog[];
  total: number;
}

interface BuildLog {
  id: string;
  workspace: string;
  status: 'success' | 'failed' | 'building';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  logs: string[];
  error?: string;
}
```

### POST /api/deploy/{workspace}
**Purpose**: Deploy a specific workspace

**Request**:
```typescript
interface DeployRequest {
  environment: 'development' | 'staging' | 'production';
  force?: boolean;
}
```

**Response**:
```typescript
interface DeployResponse {
  deploymentId: string;
  status: 'started' | 'deploying' | 'success' | 'failed';
  url?: string;
  logs: string[];
  error?: string;
}
```

## Error Responses

All API endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}
```

**Common Error Codes**:
- `WORKSPACE_NOT_FOUND`: Workspace doesn't exist
- `BUILD_FAILED`: Build process failed
- `SCHEMA_CONFLICT`: Schema synchronization conflict
- `DEPENDENCY_CONFLICT`: Dependency version conflict
- `DISCORD_API_ERROR`: Discord API communication error
- `VALIDATION_ERROR`: Request validation failed
- `PERMISSION_DENIED`: Insufficient permissions

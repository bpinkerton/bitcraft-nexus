# Setup Scripts

Interactive post-install automation for BitCraft Nexus development environment.

## Overview

The setup system is built with modular, self-contained modules that each handle a specific aspect of the development environment. Each module can detect if it needs to run and validate its completion status.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development (automatically runs setup if needed)
pnpm dev

# Or run setup manually
pnpm env:setup

# Run specific setup modules
pnpm env:setup:supabase              # Setup Supabase local instance
pnpm env:setup:spacetime             # Setup both SpacetimeDB bindings and auth
pnpm env:setup:spacetime:bindings    # Download latest bindings only
pnpm env:setup:spacetime:auth        # Configure auth token only
```

**Note**: `pnpm dev` automatically runs environment setup before starting the Next.js dev server. If everything is already configured, it starts immediately.

## Modules

### 1. Git Hooks
**Purpose**: Install Husky git hooks for conventional commits and linting

**Checks**:
- ✓ `.husky/commit-msg` exists

**Actions**:
- Runs `pnpm prepare` to install Husky hooks

---

### 2. Supabase
**Purpose**: Ensure Supabase is running locally with correct environment variables

**Checks**:
- ✓ `pnpx supabase status` returns success
- ✓ `.env.local` contains matching credentials

**Actions**:
1. Run `pnpx supabase status`
2. If running, validate credentials match `.env.local`
3. If not running, try `pnpx supabase start`
4. If start fails (not initialized), prompt to run `pnpx supabase init`
5. Update `.env.local` with credentials

**Environment Variables Set**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (optional)

---

### 3. SpacetimeDB Bindings
**Purpose**: Sync TypeScript bindings from GitHub and keep them up-to-date

**Checks**:
- ✓ `spacetime_bindings/` directory exists
- ✓ `.bindings-meta.json` matches latest GitHub commit SHA

**Actions**:
1. Prompt for binding type (global/regional) if not configured
2. Fetch latest commit SHA from GitHub repo
3. Compare with local metadata
4. Download bindings if outdated or missing
5. Save metadata for future checks

**Configuration**:
- **Global** (default): `BitCraftToolBox/BitCraft_Bindings:ts-global/src`
- **Regional**: `BitCraftToolBox/BitCraft_Bindings:ts-region/src`

**Files Created**:
- `spacetime_bindings/` - TypeScript binding files
- `.bindings-meta.json` - Metadata for update detection

---

### 4. SpacetimeDB Auth
**Purpose**: Generate and store valid `SPACETIME_AUTH_TOKEN`

**Checks**:
- ✓ `SPACETIME_AUTH_TOKEN` exists in `.env.local`
- ✓ Token is valid JWT and not expired

**Actions**:
1. Check if existing token is valid
2. If invalid or missing, prompt for BitCraft email
3. Call API to request access code: `POST /authentication/request-access-code`
4. Prompt user to enter 6-digit code from email
5. Call API to authenticate: `POST /authentication/authenticate`
6. Store token in `.env.local`

**API Endpoints**:
- Request code: `https://api.bitcraftonline.com/authentication/request-access-code?email=<email>`
- Authenticate: `https://api.bitcraftonline.com/authentication/authenticate?email=<email>&accessCode=<code>`

**Environment Variables Set**:
- `SPACETIME_AUTH_TOKEN`

---

## Architecture

### Module System

All modules extend the `Module` base class:

```typescript
abstract class Module {
  abstract readonly name: string;
  abstract readonly description: string;
  readonly dependencies: ModuleDependency[] = [];

  abstract isComplete(): Promise<boolean>;
  abstract run(): Promise<ModuleResult>;
  async validate(): Promise<boolean>;
  async cleanup(): Promise<void>;
}
```

### Module Lifecycle

1. **Detection**: `isComplete()` checks if module needs to run
2. **Execution**: `run()` performs setup with user interaction
3. **Validation**: `validate()` confirms setup succeeded
4. **Cleanup**: `cleanup()` rolls back on failure (optional)

### Utilities

#### Environment Management (`utils/env.ts`)
- `readEnvLocal()` - Parse `.env.local` into object
- `getEnvVar(key)` - Get specific variable
- `updateEnvLocal(vars)` - Merge new variables (preserves existing)
- `createEnvFile(vars)` - Create new `.env.local`
- `validateEnvVars(keys)` - Check required variables exist

#### Command Execution (`utils/exec.ts`)
- `exec(command, args)` - Execute shell command
- `pnpx(command, args)` - Execute with pnpx
- `commandExists(command)` - Check if command available

#### GitHub Integration (`utils/github.ts`)
- `fetchLatestCommitSHA(repo, branch, path)` - Get latest commit
- `fetchDirectoryContents(repo, branch, path)` - List files
- `downloadGitHubFolder(repo, branch, src, dest)` - Recursive download
- `fetchFileContent(repo, branch, path)` - Download single file

## Creating New Modules

1. **Create module file** in `scripts/modules/`:

```typescript
import { Module, ModuleResult } from './base';

export class MyModule extends Module {
  readonly name = 'My Module';
  readonly description = 'Does something useful';

  async isComplete(): Promise<boolean> {
    // Return true if already set up
    return false;
  }

  async run(): Promise<ModuleResult> {
    // Interactive setup logic
    return {
      status: 'complete',
      message: 'Setup complete'
    };
  }
}
```

2. **Add to orchestrator** in `scripts/postinstall.ts`:

```typescript
import { MyModule } from './modules/my-module';

const modules: Module[] = [
  new GitHooksModule(),
  new SupabaseModule(),
  new MyModule(), // Add here
  // ...
];
```

3. **Add script** to `package.json`:

```json
{
  "scripts": {
    "setup:mymodule": "tsx scripts/modules/my-module.ts"
  }
}
```

## Features

### Smart Detection
- Modules automatically skip if already complete
- Idempotent - safe to run multiple times
- Dependency-aware execution order

### User Experience
- Interactive prompts with @clack/prompts
- Progress spinners for long operations
- Color-coded status messages
- Multi-select for choosing modules

### CI/CD Friendly
- Automatically skips when `CI=true`
- No user interaction required
- Can be disabled with `--ignore-scripts`

### Error Handling
- Graceful failure handling
- Option to continue on module failure
- Detailed error messages
- Optional rollback support

## Troubleshooting

### Postinstall fails in CI
The script automatically detects `CI=true` and skips. If needed, use:
```bash
pnpm install --ignore-scripts
```

### Module keeps prompting
Check completion detection in `isComplete()`. The module may not be detecting existing setup correctly.

### Credentials mismatch
Run setup manually to refresh:
```bash
pnpm setup:supabase
```

### Bindings out of date
The bindings module checks GitHub on every run. If stuck, delete metadata:
```bash
rm .bindings-meta.json
pnpm setup:spacetime
```

## Development

### Running modules individually
Each module can be executed standalone:
```bash
tsx scripts/modules/supabase.ts
tsx scripts/modules/spacetime-bindings.ts
tsx scripts/modules/spacetime-auth.ts
```

### Testing without postinstall
Use the manual setup command:
```bash
pnpm setup
```

### Debugging
Add logging to module methods:
```typescript
async run(): Promise<ModuleResult> {
  console.log('Debug: checking status...');
  // ...
}
```

## Dependencies

- **@clack/prompts**: Interactive CLI prompts
- **tsx**: TypeScript execution
- **Node.js fetch**: HTTP requests (built-in)
- **Node.js fs/path**: File operations (built-in)

## License

Part of BitCraft Nexus project.

<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.0.0 → 1.1.0
  Amendment Date: 2025-10-09
  
  Principles Added:
  - VII. Pragmatic Testing (new)
  
  Sections Added:
  - Code Review & Collaboration (new)
  - Open Source Community Standards (new)
  - Security Practices (new)
  
  Principles Modified:
  - None
  
  Rationale for v1.1.0 (MINOR):
  - Added new principles and sections for multi-developer collaboration
  - Added open source governance requirements
  - Added security practices for public repositories
  - No backward-incompatible changes to existing principles
  
  Templates Status:
  - ✅ plan-template.md - Aligned with constitution gates
  - ✅ spec-template.md - Aligned with user story prioritization
  - ✅ tasks-template.md - Aligned with testing/implementation phases
  
  Follow-up TODOs:
  - Consider adding PR template (.github/pull_request_template.md)
  - Consider adding issue templates (.github/ISSUE_TEMPLATE/)
  - Consider adding SECURITY.md for vulnerability disclosure
-->

# Bitcraft Nexus Constitution

## Core Principles

### I. Developer Experience First (DX)

**Onboarding MUST be automated and frictionless.**

- New developers MUST be able to run `pnpm install` and have a fully working local environment without manual configuration
- Setup scripts MUST handle Supabase initialization, environment generation, and dependency configuration automatically
- Development workflow MUST use type-safe tooling (TypeScript, Drizzle ORM) to catch errors at compile time, not runtime
- Hot reloading and fast feedback loops are NON-NEGOTIABLE for all development activities
- Command aliases (`pnpm dev`, `pnpm db:push`) MUST be intuitive and documented

**Rationale:** Developer productivity directly impacts project velocity. Automated setup reduces onboarding from hours to minutes, and type safety eliminates entire classes of runtime errors. Fast iteration cycles enable rapid experimentation and feature delivery.

### II. Type Safety & Validation

**Type safety MUST extend from database to UI.**

- Database schema MUST be defined in TypeScript (Drizzle schema) - no raw SQL for schema definitions
- All database queries MUST use Drizzle ORM for compile-time type checking and IntelliSense
- API boundaries (Server Actions, Route Handlers) MUST validate input with type-safe schemas
- Frontend components MUST receive properly typed props - no `any` types except when interfacing with untyped third-party libraries
- Export and use inferred types (`InferSelectModel`, `InferInsertModel`) from schema definitions

**Rationale:** Type safety eliminates entire categories of bugs before code runs. Database-to-UI type safety ensures schema changes are caught immediately across the entire stack, preventing production runtime errors from mismatched expectations.

### III. Modern Full-Stack Patterns

**Leverage Next.js App Router patterns correctly.**

- Server Components MUST be the default - only use Client Components when interactivity or browser APIs are required
- Database queries and authentication checks MUST only occur in Server Components, Server Actions, or Route Handlers - NEVER in Client Components
- Mutations MUST use Server Actions with proper revalidation (`revalidatePath`, `revalidateTag`)
- Use Supabase for authentication, storage, and realtime features - use Drizzle for data queries and mutations
- Middleware MUST handle auth session refresh but MUST NOT perform business logic or database queries
- Progressive enhancement: forms SHOULD work without JavaScript when possible

**Rationale:** Next.js 15 and React Server Components represent a paradigm shift in full-stack development. Proper usage delivers better performance (less client JavaScript), better security (credentials never exposed to client), and better developer experience (direct database access in components). Mixing patterns incorrectly creates security vulnerabilities and performance issues.

### IV. User Experience First (UX)

**Performance and accessibility are NON-NEGOTIABLE.**

- Initial page load MUST prioritize Server Components to minimize JavaScript sent to client
- Loading states MUST be implemented using `loading.tsx` and Suspense boundaries
- Error states MUST be handled gracefully with `error.tsx` boundaries
- Forms MUST show validation feedback immediately and handle errors gracefully
- UI components MUST follow accessibility standards (ARIA labels, keyboard navigation, focus management)
- Use shadcn/ui components as foundation - they are accessible by default
- Dark mode MUST be supported using `next-themes` without flash of unstyled content
- Mobile-first responsive design is MANDATORY

**Rationale:** User experience directly impacts product success. Server-first rendering improves perceived and actual performance. Accessibility is a legal requirement and expands user base. Graceful error handling and loading states prevent user frustration and abandonment.

### V. Automated Quality Gates

**Quality MUST be enforced automatically, not manually.**

- All commits MUST follow Conventional Commits specification - enforced by commitlint hooks
- Git hooks (husky) MUST run linting and commit message validation before commits
- TypeScript MUST compile without errors before deployment
- Database migrations MUST be generated and reviewed before production deployment
- Use `db:push` for development iteration, `db:generate` for production migrations
- Breaking changes MUST be documented and marked with `!` or `BREAKING CHANGE:` in commits

**Rationale:** Manual quality checks are unreliable and don't scale. Automated gates ensure consistency across all contributors. Conventional commits enable automatic changelog generation and semantic versioning. Migration discipline prevents production database disasters.

### VI. Documentation as Code

**Documentation MUST be maintained alongside code.**

- Every feature MUST include inline documentation for complex logic
- Database schema MUST use descriptive table and column names - documentation is in the code
- README files MUST be updated when setup procedures change
- `docs/` directory MUST contain workflow guides that are kept up-to-date
- Quick Start guides MUST be tested and reflect actual working commands
- Troubleshooting docs MUST be updated when new issues are discovered and resolved
- Architecture decisions SHOULD be documented in ADR format when significant

**Rationale:** Documentation drift is inevitable when separated from code. Inline documentation and co-located guides are more likely to be maintained. New developers rely on accurate documentation for onboarding - stale docs are worse than no docs.

### VII. Pragmatic Testing

**Test critical paths, not coverage percentages.**

- **NEW features SHOULD include tests** - especially for complex business logic, authentication, and data mutations
- **Critical user flows MUST be testable** - even if automated tests don't exist yet, manual test procedures MUST be documented
- **Type safety reduces testing needs** - TypeScript + Drizzle already prevent many bugs that would require unit tests in dynamic languages
- **Avoid testing implementation details** - test behavior and contracts, not internal component state
- **Testing MUST NOT block contributions** - lack of tests is not grounds for rejecting PRs if the feature works and is documented
- **Test growth is incremental** - projects start with few tests and grow coverage over time as patterns emerge

**Recommended Testing Priorities (in order):**
1. **Authentication & Authorization** - Critical security paths
2. **Data Mutations** - Create, update, delete operations that modify database state
3. **API Contracts** - Public API endpoints and Server Actions
4. **Critical User Journeys** - Core workflows that define product value
5. **Edge Cases** - Only after happy paths are established

**Testing Tools (when adding tests):**
- **Vitest** for unit/integration tests
- **Playwright** for E2E browser tests
- **Manual testing procedures** documented until automated tests exist

**Mirage JS** for API mocking

**Rationale:** Testing is valuable but should not paralyze development, especially in early stages. For TypeScript full-stack apps, type safety catches many bugs that unit tests would catch in dynamic languages. Focus testing effort on high-risk areas (auth, data mutations, critical paths) rather than chasing coverage metrics. As the project matures, test coverage grows naturally where value is proven.

## Technical Standards

### Stack Requirements

**Core Stack (NON-NEGOTIABLE):**
- **Runtime:** Node.js 20+
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript 5+ (strict mode enabled)
- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle ORM with Drizzle Kit
- **Auth:** Supabase Auth with SSR cookies
- **Styling:** Tailwind CSS 3+
- **Components:** shadcn/ui (Radix UI primitives)
- **Package Manager:** pnpm
- **Containerization:** Docker (for local Supabase)

**Additional Integrations (APPROVED):**
- **SpacetimeDB SDK:** For real-time multiplayer features
- **Conventional Commits:** Enforced via commitlint + husky
- **Deployment:** Vercel (recommended) or compatible platforms

### Development vs Production

**Development Workflow:**
- Use `pnpm db:push` for rapid schema iteration without migration files
- Local Supabase instance via Docker (managed by setup scripts)
- Hot reloading for immediate feedback
- Drizzle Studio (`pnpm db:studio`) for visual database inspection

**Production Workflow:**
- Use `pnpm db:generate` to create migration files from schema changes
- Review generated SQL before committing
- Migrations MUST be committed to version control
- Test migrations locally with `pnpm supabase:reset` before deploying
- Never use `db:push` in production

### File Organization

**Required Structure:**
```
bitcraft-nexus/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups for organization
│   ├── api/               # Route handlers
│   └── actions.ts         # Server Actions (co-located or centralized)
├── components/
│   ├── ui/                # shadcn/ui components
│   └── [feature]/         # Feature-specific components
├── lib/
│   ├── db/
│   │   ├── index.ts       # Drizzle client instance
│   │   └── schema.ts      # Database schema definitions
│   ├── supabase/
│   │   ├── client.ts      # Client-side Supabase client
│   │   ├── server.ts      # Server-side Supabase client
│   │   └── middleware.ts  # Auth middleware utilities
│   └── utils.ts           # Shared utilities
├── docs/                  # Project documentation
├── scripts/               # Setup and automation scripts
└── supabase/
    ├── migrations/        # Generated SQL migrations
    └── config.toml        # Supabase configuration
```

## Development Workflow

### Feature Development Process

1. **Specification Phase:**
   - Define user stories with acceptance criteria
   - Prioritize features (P1, P2, P3)
   - Identify database schema requirements

2. **Schema Definition:**
   - Define tables in `lib/db/schema.ts` using Drizzle schema
   - Export TypeScript types (`InferSelectModel`, `InferInsertModel`)
   - Push to local database: `pnpm db:push`

3. **Implementation Phase:**
   - Create Server Components for data fetching and rendering
   - Create Server Actions for mutations
   - Use Client Components only when necessary (`'use client'`)
   - Implement error boundaries and loading states

4. **Quality Phase:**
   - Ensure TypeScript compiles without errors
   - Test locally with local Supabase instance
   - Validate accessibility of UI components
   - Write meaningful commit messages (Conventional Commits)

5. **Production Preparation:**
   - Generate migrations: `pnpm db:generate`
   - Review generated SQL files
   - Test migration locally: `pnpm supabase:reset`
   - Commit schema and migrations together

### Commit Message Discipline

**Format:** `<type>(<scope>): <subject>`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**
- `feat(auth): add password reset flow`
- `fix(db): resolve user profile foreign key constraint`
- `docs: update quick start guide with new commands`
- `refactor(api): simplify authentication logic`

**Breaking Changes MUST use:**
- `feat(api)!: change authentication endpoint structure` OR
- Include `BREAKING CHANGE:` in commit footer

## Code Review & Collaboration

### Pull Request Requirements

**All code contributions MUST go through pull requests - no direct commits to `main` or `master`.**

- **Branch naming convention:** `feature/description`, `fix/description`, or `docs/description`
- **PR title MUST follow Conventional Commits** format (will become the merge commit message)
- **PR description MUST include:**
  - What was changed and why
  - How to test the changes
  - Screenshots/videos for UI changes
  - Breaking changes highlighted
  - Related issues linked
- **Draft PRs** are encouraged for early feedback and work-in-progress sharing

### Review Process

**At least one approval required before merge.**

- **Reviewers SHOULD:**
  - Check for constitution principle violations
  - Verify TypeScript compiles without errors
  - Test locally if significant changes
  - Suggest improvements, not block on style preferences
  - Approve promptly (within 24-48 hours for active PRs)
- **Authors SHOULD:**
  - Keep PRs focused and reasonably sized (<500 lines when possible)
  - Respond to feedback constructively
  - Mark conversations as resolved when addressed
  - Request re-review after significant changes
- **Merge strategy:** Squash and merge (keeps git history clean, one commit per feature)

### Collaboration Guidelines

**Multi-developer coordination:**

- **Communicate early** - Draft PRs, discussions, and design docs before big changes
- **Avoid long-lived branches** - Merge frequently, use feature flags for incomplete features
- **Migration coordination** - Database migrations MUST be coordinated to avoid conflicts
- **Breaking changes** - Discuss in issues before implementation, provide migration guides
- **Pair programming encouraged** - Especially for complex features or onboarding

### Conflict Resolution

**When disagreements arise:**

1. **Assume good intent** - All contributors want the project to succeed
2. **Discuss in issues/PRs** - Keep conversations public and searchable
3. **Constitution as arbiter** - Reference relevant principles to ground decisions
4. **Maintainer decision** - If consensus can't be reached, maintainers make final call
5. **Document outcomes** - Update docs/constitution if patterns emerge

## Open Source Community Standards

### Licensing & Attribution

- **License:** MIT
- **All contributions** are assumed to be under the project license unless explicitly stated
- **Contributor attributions** are maintained in git history - no separate CONTRIBUTORS file needed
- **Third-party code** MUST retain original license headers and be compatible with project license

### Issue Management

**Issues are the primary communication channel for bug reports and feature requests.**

- **Bug reports SHOULD include:**
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, Node version, browser)
  - Screenshots/error messages
- **Feature requests SHOULD include:**
  - User problem being solved
  - Proposed solution
  - Alternative solutions considered
- **Good first issue** label for newcomer-friendly tasks
- **Help wanted** label for tasks seeking contributors

### Communication & Conduct

- **Be respectful** - Follow standard open source code of conduct principles
- **Be patient** - Maintainers and contributors are volunteers (unless otherwise stated)
- **Be constructive** - Criticism should be specific, actionable, and kind
- **Be inclusive** - Welcome contributors of all experience levels
- **Use English** - Primary language for issues, PRs, and documentation

### Contribution Recognition

- **All contributors** are valued regardless of contribution size
- **First-time contributors** receive extra support and patience
- **Regular contributors** may be invited to become maintainers
- **Maintainer status** is earned through consistent, quality contributions over time

## Security Practices

### Dependency Management

**Dependencies MUST be kept reasonably up-to-date.**

- **Dependabot or Renovate** SHOULD be enabled for automated dependency PRs
- **Security vulnerabilities** MUST be addressed promptly (within 7 days for critical, 30 days for high)
- **Major version updates** SHOULD be tested thoroughly before merging
- **Lock files** (`pnpm-lock.yaml`) MUST be committed to ensure reproducible builds
- **Review dependency additions** - prefer well-maintained packages with active communities

### Secret Management

**Secrets MUST NEVER be committed to the repository.**

- **`.env.local`** is gitignored - contains local secrets
- **`.env.example`** SHOULD document required environment variables without actual values
- **GitHub Secrets** for CI/CD credentials
- **Rotate secrets immediately** if accidentally committed (even if removed in later commit)
- **Supabase service role keys** MUST ONLY be used server-side, NEVER in client code

### Vulnerability Disclosure

**Security vulnerabilities should be reported responsibly.**

- **Public repository** - Consider adding `SECURITY.md` with disclosure process
- **Private disclosure first** - Give maintainers time to fix before public announcement
- **No blame culture** - Thank reporters, fix issues, document lessons learned
- **Security advisories** - Use GitHub Security Advisories for coordinated disclosure

### Code Security Practices

- **Input validation** - Validate all user input on server-side (Client Components can't be trusted)
- **SQL injection prevention** - Use Drizzle ORM parameterized queries (never string concatenation)
- **Authentication checks** - Always verify user identity in Server Actions/Route Handlers
- **Authorization checks** - Verify user permissions before data access/mutations
- **Rate limiting** - Implement for public APIs to prevent abuse
- **CORS configuration** - Restrict cross-origin requests appropriately

## Governance

### Constitution Authority

This Constitution supersedes all other development practices, guidelines, or conventions. When conflicts arise between this document and other sources, the Constitution takes precedence.

### Amendment Process

1. **Proposal:** Amendments MUST be proposed via pull request with rationale
2. **Discussion:** Changes MUST be reviewed by project maintainers
3. **Approval:** Requires consensus among maintainers
4. **Versioning:** Constitution version MUST be updated according to semantic versioning:
   - **MAJOR:** Backward-incompatible changes (principle removal/redefinition)
   - **MINOR:** New principles or sections added
   - **PATCH:** Clarifications, wording improvements, non-semantic changes
5. **Migration:** If amendment requires code changes, a migration plan MUST be included

### Compliance Review

- All pull requests MUST verify compliance with Core Principles
- Feature plans MUST include a "Constitution Check" section
- Violations MUST be justified in a "Complexity Tracking" table
- Unjustified violations MUST be refactored before merge

### Complexity Justification

When a feature violates a principle, it MUST document:
1. **Which principle is violated**
2. **Why the violation is necessary**
3. **What simpler alternatives were considered and why they were rejected**

### Runtime Guidance

For day-to-day development guidance, consult:
- `docs/DEVELOPMENT_WORKFLOW.md` - Daily development patterns
- `docs/QUICK_START.md` - Onboarding and first feature
- `docs/DATABASE_ARCHITECTURE.md` - Supabase + Drizzle architecture
- `docs/DRIZZLE_GUIDE.md` - ORM reference and patterns
- `docs/SETUP_TROUBLESHOOTING.md` - Common issues and solutions

**Version**: 1.1.0 | **Ratified**: 2025-10-09 | **Last Amended**: 2025-10-09

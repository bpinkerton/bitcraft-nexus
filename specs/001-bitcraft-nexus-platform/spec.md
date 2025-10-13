# Feature Specification: BitCraft Nexus Platform Infrastructure

**Feature Branch**: `001-bitcraft-nexus-platform`
**Created**: 2025-10-11
**Status**: Draft
**Input**: User description: "BitCraft Nexus Platform - Build BitCraft Nexus, a unified Next.js web application that consolidates essential BitCraft community tools into a single, cohesive experience. The application consumes a normalized Game Data API (buffer service) that interfaces with a third party spacetime database. It provides recipe browsing, workflow optimization, interactive maps, resource tracking, and empire planning tools that seamlessly share data through a consistent UI. The platform will also include Discord Bot hooks to tap into certain elements of the application. Everything you can do in the UI, you can do via the API. The application will leverage supabase for auth via discord OAuth and app data storage. The user profiles we build should be associated with three entities: Our application (some form of profile id), Discord (via OAuth, we will likely need their discord id or something to associate with the discord bot commands), BitCraft Game User (this will likely be a player id of some sort and we need to define a mechinism to consistently link)"

## Clarifications

### Session 2025-10-12

- Q: What logging/metrics/tracing approach should the platform implement for operational visibility? → A: Full observability deferred - implement minimal logging now, add comprehensive monitoring post-pilot
- Q: What rate limits should apply per authenticated user for API requests? → A: 500 requests per minute per user
- Q: What cache TTL should apply to game data responses from the normalized API? → A: Different TTLs per data category - Static reference data: 24 hours, Semi-static data: 6 hours, Dynamic data: 1 hour, Real-time data: 5 minutes
- Q: What encryption strategy should the platform implement beyond default provider settings? → A: Rely entirely on Supabase's encryption at rest and HTTPS in transit, with focus on secure token handling (HTTPS-only enforcement, short-lived JWT tokens with refresh mechanism)
- Q: How should the platform handle scaling if pilot phase exceeds 5000 concurrent users? → A: Defer scaling strategy until hosting provider selected; likely containerized deployment with load-balanced replicas

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Authentication & Three-Way Identity Linking (Priority: P1)

A BitCraft player wants to use the Nexus platform. They visit the site, authenticate using their Discord account through OAuth, and are guided through linking their BitCraft game account via email verification. Once complete, they have a unified profile that works across the web platform and Discord bot.

**Why this priority**: Authentication and identity linking is the absolute foundation of the platform. Without this working correctly, no other features can function properly. All future features depend on having a reliable, three-way identity system (platform ID, Discord ID, BitCraft player ID).

**Independent Test**: Can be fully tested by completing Discord OAuth flow, verifying BitCraft email ownership through the two-step POST process, and confirming all three identities are correctly associated and persisted. Delivers immediate value by enabling any future feature that needs to know "who is this user?"

**Acceptance Scenarios**:

1. **Given** a new visitor to the platform, **When** they click "Sign in with Discord", **Then** they are redirected to Discord OAuth, authenticate successfully, and return with an active session and a new platform profile ID
2. **Given** an authenticated user without a linked BitCraft account, **When** they enter their BitCraft email on the linking page, **Then** the system sends a POST request to trigger an access code and displays instructions
3. **Given** a user who has received an access code, **When** they enter the code, **Then** the system validates via POST request, confirms successful verification, discards the returned token, and stores the verified email with its associated player ID
4. **Given** a user attempts to link a BitCraft email already associated with another profile, **When** they submit the verification code, **Then** the system prevents duplicate linking and shows an appropriate error message
5. **Given** a fully linked user, **When** they sign out and sign back in, **Then** their session is restored with all three identities (platform, Discord, BitCraft) intact
6. **Given** a linked user, **When** they navigate to account settings, **Then** they can view all three linked identities and have options to unlink/relink their BitCraft account

---

### User Story 2 - Game Data API Integration Layer (Priority: P2)

Platform administrators need to consume game data from the normalized Game Data API (buffer service). The platform establishes a connection to the API, implements caching strategies to reduce load, handles API unavailability gracefully, and exposes game data through internal endpoints that future features can consume.

**Why this priority**: The game data integration layer is the second foundational piece. Future features (recipes, maps, etc.) will consume this data, but they need a reliable, cached, resilient layer between them and the external spacetime database. This establishes the pattern for how all game data flows through the platform.

**Independent Test**: Can be fully tested by configuring API credentials, fetching sample game data, verifying caching behavior with TTL expiration, and testing graceful degradation when the external API is unavailable. Delivers value by creating a stable, performant foundation for future data-driven features.

**Acceptance Scenarios**:

1. **Given** the platform is starting up, **When** it initializes the game data client, **Then** it successfully connects to the normalized Game Data API using configured credentials
2. **Given** a feature requests game data, **When** the request is made for the first time, **Then** the platform fetches from the external API and caches the response with appropriate TTL
3. **Given** cached game data exists, **When** a subsequent request is made before TTL expires, **Then** the platform serves from cache without calling the external API
4. **Given** cached data has expired, **When** a request is made, **Then** the platform refreshes the cache by fetching updated data from the external API
5. **Given** the external API is unavailable, **When** a request is made, **Then** the platform serves stale cached data with a staleness indicator and logs the failure
6. **Given** API access is controlled during pilot phase, **When** a request is made, **Then** the platform validates the requesting client has an approved API key before serving data

---

### User Story 3 - RESTful API Architecture (Priority: P3)

Developers building future features need a consistent API architecture. The platform provides RESTful endpoints with authentication, rate limiting, pagination, and error handling patterns that all features will follow. This enables both web UI and Discord bot to access functionality through the same standardized interface.

**Why this priority**: API-first design is essential for the stated goal "everything you can do in the UI, you can do via the API." Establishing API patterns now ensures consistency across all future features and enables the Discord bot integration. This prevents technical debt from inconsistent endpoint designs.

**Independent Test**: Can be fully tested by creating sample endpoints, verifying authentication requirements, testing rate limiting behavior, confirming pagination works correctly, and validating error response formats. Delivers value by reducing development time for future features that can follow established patterns.

**Acceptance Scenarios**:

1. **Given** a client makes an API request to a protected endpoint, **When** they provide a valid session token, **Then** the request is authenticated and processed
2. **Given** a client makes an API request without authentication, **When** they attempt to access a protected resource, **Then** the API returns a 401 Unauthorized response with a standard error format
3. **Given** a user makes repeated API requests, **When** they exceed the rate limit threshold, **Then** the API returns a 429 Too Many Requests response with rate limit headers
4. **Given** an API endpoint returns a list of items, **When** the client requests with pagination parameters, **Then** the response includes the requested page of results and pagination metadata
5. **Given** an API request fails due to validation errors, **When** the API processes the request, **Then** it returns a 400 Bad Request with specific field-level error messages in a consistent format
6. **Given** an API endpoint experiences an internal error, **When** the error occurs, **Then** the API returns a 500 Internal Server Error with a safe error message and logs the full error details

---

### User Story 4 - Discord Bot Integration Framework (Priority: P4)

BitCraft community managers want to deploy a Discord bot that players can use in their guild servers. The platform provides a bot framework that authenticates users via Discord ID, calls the platform's REST API endpoints, and formats responses appropriately for Discord's interface.

**Why this priority**: Discord is a primary communication channel for BitCraft communities. The bot framework extends platform reach without duplicating business logic - it's purely an interface layer over the REST API. This enables community engagement without requiring users to leave Discord.

**Independent Test**: Can be fully tested by deploying the bot to a test Discord server, invoking commands that call API endpoints, verifying Discord ID-based authentication works, and confirming responses are properly formatted for Discord. Delivers value by providing a working template for any future Discord bot command.

**Acceptance Scenarios**:

1. **Given** a user with a linked Nexus profile, **When** they invoke a bot command in Discord, **Then** the bot authenticates them via their Discord ID and successfully retrieves their profile data from the API
2. **Given** a user without a linked Nexus profile, **When** they attempt a command requiring authentication, **Then** the bot provides a link to the web platform with instructions to link their account
3. **Given** a bot command returns data from the API, **When** the response is received, **Then** the bot formats it as a Discord embed with appropriate styling and sends it as an ephemeral message
4. **Given** an API request takes longer than 3 seconds, **When** the bot is waiting for a response, **Then** it sends a "processing" indicator to the user and handles the response asynchronously if needed
5. **Given** multiple users in a Discord server, **When** they invoke bot commands simultaneously, **Then** each user receives their own ephemeral response without interfering with others
6. **Given** the bot encounters an API error, **When** the error occurs, **Then** the bot sends a user-friendly error message in Discord and logs the technical details

---

### User Story 5 - Data Persistence Infrastructure (Priority: P5)

The platform needs to store user-generated data reliably and consistently. Using Supabase PostgreSQL with Drizzle ORM, the platform provides database schemas, migrations, and access patterns that all future features will use for storing user profiles, preferences, and feature-specific data.

**Why this priority**: While authentication can work without much data persistence initially, features will immediately need to save user-generated content (favorites, plans, markers, etc.). Establishing database patterns now ensures data consistency and makes feature development faster.

**Independent Test**: Can be fully tested by defining core schemas (user profiles, identity links), running migrations, performing CRUD operations, testing soft deletes, and verifying audit logging works. Delivers value by providing a stable, type-safe data layer for all future features.

**Acceptance Scenarios**:

1. **Given** a new user completes authentication, **When** their profile is created, **Then** a record is inserted with platform ID, Discord ID, timestamps, and default settings
2. **Given** a user links their BitCraft account, **When** the verification succeeds, **Then** the BitCraft email and player ID are atomically updated in their profile record
3. **Given** a user deletes some content, **When** the deletion is processed, **Then** the record is soft-deleted (marked as deleted with timestamp) rather than permanently removed
4. **Given** a critical operation occurs (profile linking, identity changes), **When** the operation completes, **Then** an audit log entry is created with user ID, action type, timestamp, and relevant details
5. **Given** related data exists across tables, **When** a parent record is deleted, **Then** foreign key constraints ensure data consistency (either cascade or prevent deletion)
6. **Given** a database migration is needed, **When** the migration runs, **Then** schema changes are applied without data loss and a rollback script is available

---

### User Story 6 - API Key Management for Pilot Phase (Priority: P6)

Platform administrators need to control API access during the pilot phase. The system provides an API key management interface where admins can generate keys for approved clients (web UI, Discord bot, pilot participants), revoke keys if needed, and monitor usage.

**Why this priority**: While Q2's answer specified API key-based access control, the management interface is lower priority than the core platform infrastructure. The web UI and Discord bot need working keys, but a full admin UI for key management can be simpler initially or even manual.

**Independent Test**: Can be fully tested by generating API keys, validating key authentication on API requests, revoking keys and confirming access is denied, and viewing basic usage metrics per key. Delivers value by enabling controlled rollout and preventing abuse during pilot phase.

**Acceptance Scenarios**:

1. **Given** an administrator wants to onboard a pilot participant, **When** they generate a new API key, **Then** a unique key is created with associated metadata (name, creation date, permissions)
2. **Given** a client makes an API request with a valid key, **When** the request is processed, **Then** the system validates the key and logs usage against that key's usage tracking
3. **Given** an administrator needs to revoke access, **When** they deactivate an API key, **Then** subsequent requests using that key are rejected with 401 Unauthorized
4. **Given** administrators want to monitor pilot usage, **When** they view the API key dashboard, **Then** they see metrics for each key (request counts, last used timestamp, error rates)
5. **Given** the platform is ready to go fully public, **When** administrators disable pilot mode, **Then** API key requirement is removed and all requests are accepted (with rate limiting)
6. **Given** a key is compromised, **When** it is regenerated, **Then** the old key is immediately revoked and a new key with the same permissions is issued

---

### Edge Cases

- What happens when Discord OAuth is temporarily unavailable? (Show maintenance message, queue retry, allow existing sessions to continue)
- How does the system handle BitCraft's verification API returning errors or timeouts? (Show user-friendly error, allow retry, provide fallback contact method)
- What happens if a user's Discord account is deleted or unlinked from Discord's side? (Mark Discord association as inactive, preserve platform profile with email fallback)
- How does caching behave when the external game data API returns inconsistent data? (Detect inconsistencies via checksums, invalidate suspicious cache entries, log anomalies)
- What happens when database migrations need to run while the platform is live? (Use zero-downtime migration patterns, run in transaction, implement rollback procedures)
- How does the platform handle API rate limiting from the external game data API? (Implement exponential backoff, queue requests, prioritize user-facing requests)
- What happens when multiple requests try to link the same BitCraft account simultaneously? (Use database-level uniqueness constraints, handle race conditions with optimistic locking)
- How does the Discord bot behave when deployed to hundreds of servers with thousands of simultaneous requests? (Implement bot-level rate limiting, queue command processing, scale horizontally if needed)
- What happens when Supabase PostgreSQL reaches connection limits? (Implement connection pooling, queue queries, scale database resources, show graceful degradation message)
- How does the system handle gradual rollout of API features to pilot vs public? (Use feature flags per API key or user cohort, version API endpoints if needed)

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Identity Management**

- **FR-001**: System MUST authenticate users exclusively via Discord OAuth through Supabase Auth
- **FR-002**: System MUST create a unique platform profile ID for each new user upon first successful authentication
- **FR-003**: System MUST store Discord user ID and username obtained from OAuth for each user profile
- **FR-004**: System MUST provide a profile linking interface for users to associate their BitCraft player ID
- **FR-005**: System MUST verify BitCraft account ownership via email verification flow: user enters their BitCraft email, system sends POST request to trigger access code delivery, user enters received code, system validates via POST request and confirms successful verification (discarding returned token), then stores the verified email. Note: Player ID extraction is deferred pending exploration of SpacetimeDB WebSocket schema (JWT `hex_identity` and `sub` fields are not the player IDs required for game data features).
- **FR-006**: System MUST validate that BitCraft email addresses are not already associated with another platform profile before linking
- **FR-007**: Users MUST be able to view their linked identities (platform ID, Discord ID, BitCraft email) in account settings
- **FR-008**: Users MUST be able to unlink their BitCraft email and link a different one (with appropriate validation)
- **FR-009**: System MUST maintain user session state across page navigation and browser restarts until explicit sign-out
- **FR-010**: System MUST handle Discord OAuth failures gracefully with user-friendly error messages and retry options

**Game Data API Integration**

- **FR-011**: System MUST consume game data from the normalized Game Data API (buffer service) that interfaces with the spacetime database
- **FR-012**: System MUST implement API key-based access control for game data API during pilot phase, restricting access to approved clients (web UI, Discord bot, and pilot program participants), with plans to transition to fully public API access in future phases
- **FR-013**: System MUST cache game data responses with category-specific TTLs to minimize API calls: static reference data (recipes, item definitions) at 24 hours, semi-static data (resource nodes, biomes) at 6 hours, dynamic data (territories, economy) at 1 hour, and real-time data (player counts, events) at 5 minutes
- **FR-014**: System MUST handle API unavailability gracefully by serving stale cached data with staleness indicators
- **FR-015**: System MUST refresh cached game data automatically when category-specific TTL expires
- **FR-016**: System MUST display data freshness timestamps to users (e.g., "Updated 5 minutes ago")
- **FR-017**: System MUST implement exponential backoff when the external game data API returns rate limit errors
- **FR-018**: System MUST log all interactions with the external game data API for debugging and monitoring

**RESTful API Architecture**

- **FR-019**: System MUST provide RESTful API endpoints following consistent design patterns (resource naming, HTTP verbs, response formats)
- **FR-020**: API MUST require authentication via session tokens for protected resources
- **FR-021**: API MUST implement rate limiting of 500 requests per minute per authenticated user to prevent abuse while supporting normal interactive usage patterns
- **FR-022**: API MUST return consistent error responses with appropriate HTTP status codes and structured error messages
- **FR-023**: API MUST support pagination for list endpoints with configurable page sizes
- **FR-024**: API MUST include CORS headers to support web UI and approved third-party clients
- **FR-025**: API MUST version endpoints to enable backward compatibility as the platform evolves
- **FR-026**: API MUST log all requests with user ID, endpoint, parameters, and response time for monitoring

**Discord Bot Framework**

- **FR-027**: Discord bot MUST authenticate users via their Discord ID mapped to platform profiles
- **FR-028**: Discord bot MUST handle unauthenticated command attempts by providing profile linking instructions with web platform URL
- **FR-029**: Discord bot MUST format responses appropriately for Discord (embeds, buttons, ephemeral messages)
- **FR-030**: Discord bot MUST respect Discord's rate limits and respond within 3 seconds or provide async response mechanisms
- **FR-031**: Discord bot MUST provide a curated subset of features optimized for Discord interaction, rather than attempting full feature parity with the web UI
- **FR-032**: Discord bot MUST call platform REST API endpoints rather than duplicating business logic
- **FR-033**: Discord bot MUST handle API errors gracefully and present user-friendly messages in Discord
- **FR-034**: Discord bot MUST log all command invocations with user ID, command, and outcome for monitoring

**Data Persistence Infrastructure**

- **FR-035**: System MUST persist all user-generated data in Supabase PostgreSQL
- **FR-036**: System MUST use Drizzle ORM for type-safe database operations
- **FR-037**: System MUST define database schemas in code and generate migrations
- **FR-038**: System MUST ensure data consistency across related entities using foreign key constraints
- **FR-039**: System MUST implement soft deletes for user-generated content to enable recovery
- **FR-040**: System MUST maintain audit logs for critical operations (profile linking, identity changes)
- **FR-041**: System MUST use database transactions for operations affecting multiple tables
- **FR-042**: System MUST implement zero-downtime migration patterns for schema changes

**API Key Management (Pilot Phase)**

- **FR-043**: System MUST provide an interface for administrators to generate API keys for approved clients
- **FR-044**: System MUST associate each API key with metadata (name, creation date, permissions, owner)
- **FR-045**: System MUST validate API keys on incoming requests during pilot phase
- **FR-046**: System MUST track usage metrics per API key (request counts, last used timestamp, error rates)
- **FR-047**: Administrators MUST be able to revoke API keys, immediately blocking further access
- **FR-048**: System MUST provide a feature flag to disable pilot mode and transition to fully public API access
- **FR-049**: System MUST rate limit per API key in addition to per-user rate limiting

### Non-Functional Requirements

**Observability & Operations**

- **NFR-001**: System MUST implement minimal logging during pilot phase (console output with timestamps, user IDs, endpoint paths, and error stack traces)
- **NFR-002**: System MUST defer comprehensive observability (structured logging, custom metrics, distributed tracing) to post-pilot phases
- **NFR-003**: System MUST log critical operations to Supabase audit table for compliance (profile linking, API key operations, identity changes)
- **NFR-004**: System SHOULD leverage Supabase native query metrics and Vercel/hosting provider default analytics without custom instrumentation during pilot

**Security & Data Protection**

- **NFR-005**: System MUST enforce HTTPS-only for all API endpoints and web pages (no HTTP fallback)
- **NFR-006**: System MUST rely on Supabase's built-in encryption at rest for all database storage without additional application-layer encryption
- **NFR-007**: System MUST use Supabase Auth's JWT token mechanism with short-lived access tokens and secure refresh token rotation
- **NFR-008**: System MUST prevent token replay attacks by validating token expiry and binding tokens to user sessions
- **NFR-009**: API keys MUST be transmitted only via secure headers (Authorization header) and never in URL query parameters
- **NFR-010**: System MUST implement secure session management following OWASP guidelines (HttpOnly cookies, SameSite attributes, CSRF protection)

### Key Entities

- **User Profile**: Represents a platform user with three associated identities (platform ID generated on first auth, Discord ID from OAuth, BitCraft email from verification). Contains account settings, preferences, creation/update timestamps. Links to all user-generated content in future features. Note: BitCraft player ID will be added in future after WebSocket schema exploration.

- **Discord Integration Record**: Associates a Discord user ID (from OAuth) with a platform profile ID. Contains Discord username for display purposes. Used by Discord bot for command authentication. Marked inactive if Discord account is deleted or unlinked.

- **BitCraft Identity Link**: Associates a verified BitCraft email address with the platform profile. Created during the two-step verification process. Enforces uniqueness to prevent duplicate linking. Contains verification timestamp and verification method metadata. Note: Player ID field deferred until SpacetimeDB WebSocket schema is explored to determine correct player ID retrieval method (JWT `hex_identity` and `sub` fields are not the required player IDs).

- **Game Data Cache Entry**: System-level cache of responses from the normalized Game Data API. Contains cache key (endpoint/parameters), response body (JSON), data category (static/semi-static/dynamic/real-time), category-specific TTL (24h/6h/1h/5min), fetch timestamp, and staleness indicator. Enables offline resilience and reduces API load.

- **API Key**: Pilot phase access control entity. Contains unique key value, associated client name/description, creation timestamp, active/revoked status, permissions scope, and usage tracking metadata. Used to gate API access during controlled rollout.

- **Audit Log Entry**: Records critical system operations for security and debugging. Contains user ID (if applicable), action type, timestamp, affected resource IDs, old/new values for changes, and IP address. Immutable once written.

- **Session**: User authentication session managed by Supabase Auth. Contains session token, user ID, creation/expiry timestamps, and refresh token. Persisted to enable cross-device sessions and automatic renewal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete Discord OAuth authentication and create a platform profile in under 60 seconds
- **SC-002**: Users can complete BitCraft email verification (both POST requests) and successfully link their player ID in under 3 minutes
- **SC-003**: 95% of game data requests are served from cache, reducing load on the external spacetime database API
- **SC-004**: When the external game data API is unavailable, the platform continues serving cached data with less than 1 second latency
- **SC-005**: All REST API endpoints respond within 500 milliseconds for 95% of requests under normal load
- **SC-006**: Platform supports 500 concurrent authenticated users without performance degradation
- **SC-007**: Discord bot commands respond within 3 seconds for 95% of requests
- **SC-008**: Discord bot successfully authenticates users via Discord ID linking with 98% success rate for users with linked profiles
- **SC-009**: Database migrations complete without downtime or data loss for 100% of schema changes
- **SC-010**: 90% of users successfully link their BitCraft player ID within their first 3 sessions
- **SC-011**: Platform maintains 99.5% uptime for core infrastructure (authentication, API gateway, database) over 30-day periods
- **SC-012**: API rate limiting (500 requests/minute per user) prevents abuse while allowing 95% of legitimate requests to succeed
- **SC-013**: During pilot phase, API key validation adds less than 10 milliseconds to request processing time
- **SC-014**: Audit logs capture 100% of critical operations (profile linking, identity changes, API key revocations)
- **SC-015**: System handles graceful degradation when external dependencies fail, maintaining core functionality for at least 4 hours on cached data

## Assumptions

- **A-001**: BitCraft game provides a two-step email verification API (POST to trigger code, POST to validate code) that returns player IDs
- **A-002**: The normalized Game Data API provides structured JSON responses with consistent schema
- **A-003**: Discord OAuth provides reliable access to user ID and username that persist across sessions
- **A-004**: The spacetime database underlying the normalized API updates periodically (assumed hourly or daily, not real-time)
- **A-005**: Standard web application performance targets apply: page load < 3s, interactions < 500ms, API responses < 1s
- **A-006**: Discord bot hosting and rate limits follow Discord's standard bot API guidelines (50 requests per second per server)
- **A-007**: Data retention follows standard SaaS practices: user data retained indefinitely while account active, 30-day grace period after account deletion
- **A-008**: Browser compatibility targets modern evergreen browsers (Chrome, Firefox, Safari, Edge) released within the last 2 years
- **A-009**: Supabase PostgreSQL provides sufficient performance and scalability for pilot phase (estimated 1000-5000 users); horizontal scaling strategy deferred to hosting provider selection (likely containerized deployment with load balancing)
- **A-010**: The BitCraft email verification API is accessible from the platform's servers (no CORS or IP restrictions)
- **A-011**: Platform administrators have access to Supabase dashboard and database management tools
- **A-012**: Future features will be specified separately and will consume this platform infrastructure

## Dependencies

- **D-001**: Access to BitCraft normalized Game Data API (buffer service) with documentation of available endpoints and response schemas
- **D-002**: Access to BitCraft email verification API with documentation of POST endpoints and expected request/response formats
- **D-003**: Supabase project configured with Discord OAuth provider credentials
- **D-004**: Discord Bot application created with appropriate permissions and bot token for API access
- **D-005**: Definition of BitCraft player ID format and validation rules
- **D-006**: Documentation of normalized Game Data API rate limits and caching recommendations
- **D-007**: Environment configuration for pilot phase (API keys, feature flags, rate limit thresholds)

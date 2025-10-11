# Database Architecture: Supabase + Drizzle

## Overview

This project uses **both** Supabase and Drizzle ORM to interact with the **same PostgreSQL database**. They are complementary tools that serve different purposes.

## Connection Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
├──────────────────────────┬──────────────────────────────────┤
│   Supabase Client        │        Drizzle ORM               │
│   (@supabase/supabase-js)│        (drizzle-orm)             │
├──────────────────────────┼──────────────────────────────────┤
│ Uses:                    │  Uses:                           │
│ NEXT_PUBLIC_SUPABASE_URL │  DATABASE_URL                    │
│ Port: 54321              │  Port: 54322                     │
│                          │                                  │
│ ↓ Via Supabase API       │  ↓ Direct PostgreSQL Connection  │
└──────────────────────────┴──────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │   Supabase PostgreSQL Database       │
        │   (Single Source of Truth)           │
        └──────────────────────────────────────┘
```

## Environment Variables

All configured automatically by `pnpm install`:

```env
# Supabase API (for @supabase/supabase-js client)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# Database connection (used by Drizzle ORM)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Key Points:

✅ **Same Database**: Both connect to the exact same PostgreSQL instance
✅ **Different Ports**:

- Port 54321 = Supabase API layer (auth, RLS, storage)
- Port 54322 = Direct PostgreSQL connection
  ✅ **Auto-configured**: The postinstall script extracts both from `supabase status`

## When to Use Each

### Use Supabase Client For:

```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// ✅ Authentication
const {
    data: { user },
} = await supabase.auth.getUser();
await supabase.auth.signIn({ email, password });

// ✅ Storage (File uploads)
await supabase.storage.from("avatars").upload(path, file);

// ✅ Realtime subscriptions
supabase
    .channel("posts")
    .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        payload => console.log(payload)
    )
    .subscribe();

// ✅ Row Level Security (RLS)
// Queries automatically respect RLS policies
const { data } = await supabase.from("posts").select("*");
```

### Use Drizzle ORM For:

```typescript
import { db } from '@/lib/db';
import { posts, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ✅ Complex queries
const postsWithAuthors = await db
  .select()
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true));

// ✅ Type-safe operations
const newPost = await db.insert(posts).values({
  title: 'Hello',
  content: 'World',
}).returning();

// ✅ Transactions
await db.transaction(async (tx) => {
  await tx.insert(users).values({ ... });
  await tx.insert(posts).values({ ... });
});

// ✅ Schema management
// Define schema in code, generate migrations
```

## Best Practices

### 1. Use Both Together

```typescript
// app/api/posts/route.ts
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export async function POST(request: Request) {
    // Get authenticated user via Supabase
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create post via Drizzle (type-safe)
    const body = await request.json();
    const newPost = await db
        .insert(posts)
        .values({
            title: body.title,
            content: body.content,
            authorId: user.id,
        })
        .returning();

    return Response.json(newPost[0]);
}
```

### 2. Schema Management Strategy

**Define in Drizzle, use everywhere:**

```typescript
// lib/db/schema.ts
export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    authorId: uuid("author_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
```

```bash
# Generate migration
pnpm db:generate

# Apply to database
pnpm db:push
```

Now both Supabase and Drizzle can query the `posts` table!

### 3. Authentication Flow

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProfilePage() {
  // Auth via Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Query via Drizzle
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, user.id))
    .limit(1);

  return <div>Welcome, {profile[0].displayName}!</div>;
}
```

## Row Level Security (RLS)

**Important:** Drizzle bypasses RLS because it connects directly to PostgreSQL.

### Options:

#### Option 1: Server-side only (Recommended)

Use Drizzle only in server components, server actions, and API routes where you control authorization:

```typescript
// app/actions/posts.ts
"use server";

import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function deletePost(postId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Manual authorization check
    const post = await db.select().from(posts).where(eq(posts.id, postId));
    if (post[0].authorId !== user.id) {
        throw new Error("Unauthorized");
    }

    await db.delete(posts).where(eq(posts.id, postId));
}
```

#### Option 2: Use Supabase client for user-facing queries

Use Supabase client (respects RLS) for user-facing operations, Drizzle for admin/background tasks:

```typescript
// User-facing: Use Supabase (RLS enforced)
const { data } = await supabase.from("posts").select("*");

// Admin/background: Use Drizzle (no RLS)
const allPosts = await db.select().from(posts);
```

## Migration Strategy

### Local Development

```bash
# 1. Define schema in lib/db/schema.ts
# 2. Push directly to database
pnpm db:push
```

### Production

```bash
# 1. Define schema in lib/db/schema.ts
# 2. Generate migration
pnpm db:generate

# 3. Review migration file in supabase/migrations/
# 4. Commit to git
git add supabase/migrations/
git commit -m "feat(db): add posts table"

# 5. Deploy (Supabase applies migrations automatically)
```

## Common Patterns

### Pattern 1: User Profiles

```typescript
// lib/db/schema.ts
export const userProfiles = pgTable("user_profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Reference Supabase auth.users
    authUserId: uuid("auth_user_id").notNull().unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Usage
const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, user.id));
```

### Pattern 2: File Metadata

```typescript
// Store files in Supabase Storage
const { data } = await supabase.storage.from("uploads").upload(path, file);

// Store metadata in database via Drizzle
await db.insert(fileMetadata).values({
    path: data.path,
    userId: user.id,
    mimeType: file.type,
    size: file.size,
});
```

### Pattern 3: Realtime + Complex Queries

```typescript
// Initial load: Complex query via Drizzle
const posts = await db
    .select()
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt));

// Subscribe to changes via Supabase
supabase
    .channel("posts")
    .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        payload => {
            // Refetch or update local state
        }
    )
    .subscribe();
```

## Troubleshooting

### "Tables not found"

Make sure you've pushed your schema:

```bash
pnpm db:push
```

### Type errors in Drizzle

Ensure you're exporting tables from schema:

```typescript
export const users = pgTable('users', { ... });
//^^^^^ Don't forget!
```

### Connection issues

Check that Supabase is running:

```bash
pnpm supabase:status
```

### Different data between Supabase and Drizzle

They connect to the same database! If you see different data:

1. Check you're querying the same table
2. Ensure Supabase RLS isn't filtering results
3. Verify no caching issues

## Summary

| Feature             | Supabase Client  | Drizzle ORM               |
| ------------------- | ---------------- | ------------------------- |
| **Connection**      | API (port 54321) | Direct PostgreSQL (54322) |
| **Auth**            | ✅ Built-in      | ❌ Manual                 |
| **Storage**         | ✅ Built-in      | ❌ N/A                    |
| **Realtime**        | ✅ Built-in      | ❌ N/A                    |
| **RLS**             | ✅ Enforced      | ❌ Bypassed               |
| **Type Safety**     | ⚠️ Generated     | ✅ Native                 |
| **Complex Queries** | ⚠️ Limited       | ✅ Full SQL               |
| **Migrations**      | ⚠️ SQL files     | ✅ Generated              |
| **Transactions**    | ❌ No            | ✅ Yes                    |

**Recommendation:** Use both! They're designed to work together, not replace each other.

- **Supabase** = Auth + Storage + Realtime + RLS
- **Drizzle** = Type-safe queries + Schema management + Complex operations

Together, they provide a complete, production-ready database solution! 🚀

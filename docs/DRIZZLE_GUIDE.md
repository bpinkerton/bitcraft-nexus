# Drizzle ORM with Supabase Guide

This project uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations with the local Supabase PostgreSQL database.

## Overview

**Drizzle ORM** provides:
- 🔒 Type-safe database queries
- 🚀 Excellent performance (no bloat)
- 📝 SQL-like syntax
- 🔄 Automatic migrations
- 🛠️ Database introspection and studio

**Architecture:**
- Supabase provides the PostgreSQL database
- Drizzle ORM handles schema and queries
- Both can work together seamlessly

## Setup

The setup is **automatic** when you run `pnpm install`. The postinstall script:
1. Sets up Supabase local instance
2. Generates `.env.local` with database credentials
3. Configures connection for both Supabase client and Drizzle

### Environment Variables

After setup, your `.env.local` will contain:

```env
# Supabase API (for @supabase/supabase-js client)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Database connection (used by both Supabase and Drizzle ORM)
# This connects directly to the Supabase PostgreSQL database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Important:** Both Supabase and Drizzle use the **exact same `DATABASE_URL`**. They connect to the same PostgreSQL database instance provided by Supabase.

## Quick Start

### 1. Define Your Schema

Edit `lib/db/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 2. Generate Migration

```bash
pnpm db:generate
```

This creates a SQL migration file in `supabase/migrations/`.

### 3. Apply Migration

You have two options:

**Option A: Push directly to database** (recommended for development)
```bash
pnpm db:push
```

**Option B: Use Supabase migration system**
```bash
pnpm supabase:reset  # Applies all migrations
```

### 4. Use in Your App

```typescript
import { db } from '@/lib/db';
import { users, posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Insert
const newUser = await db.insert(users).values({
  email: 'user@example.com',
  name: 'John Doe',
}).returning();

// Select
const allUsers = await db.select().from(users);

// Select with where
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'));

// Join
const postsWithAuthors = await db
  .select()
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id));

// Update
await db
  .update(users)
  .set({ name: 'Jane Doe' })
  .where(eq(users.id, userId));

// Delete
await db
  .delete(users)
  .where(eq(users.id, userId));
```

## Available Commands

### Drizzle Commands

```bash
pnpm db:generate    # Generate migrations from schema changes
pnpm db:push        # Push schema directly to database (dev)
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio (database GUI)
pnpm db:drop        # Drop migration
```

### Supabase Commands

```bash
pnpm supabase:start     # Start Supabase containers
pnpm supabase:stop      # Stop Supabase containers
pnpm supabase:restart   # Restart containers
pnpm supabase:status    # Check status
pnpm supabase:reset     # Reset database and run migrations
```

## Workflow

### Development Workflow

1. **Define schema** in `lib/db/schema.ts`
2. **Push to database**: `pnpm db:push`
3. **Use in your app** via `import { db } from '@/lib/db'`
4. **Iterate**: Make changes and push again

### Production Workflow

1. **Define schema** in `lib/db/schema.ts`
2. **Generate migration**: `pnpm db:generate`
3. **Review migration** in `supabase/migrations/`
4. **Commit migration** to git
5. **Deploy**: Migrations run automatically via Supabase

## Database Tools

### Drizzle Studio

Visual database browser:

```bash
pnpm db:studio
```

Opens at `https://local.drizzle.studio/`

### Supabase Studio

Full Supabase dashboard:

```bash
# Already running after pnpm install
# Visit: http://127.0.0.1:54323
```

## Schema Design Tips

### Relations

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

### Indexes

```typescript
import { index } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  // ... columns
}, (table) => ({
  authorIdx: index('author_idx').on(table.authorId),
  titleIdx: index('title_idx').on(table.title),
}));
```

### Enums

```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  role: roleEnum('role').default('user').notNull(),
});
```

### Default Values

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  credits: integer('credits').default(100),
});
```

## Working with Supabase Auth

Drizzle works alongside Supabase Auth. The `auth.users` table is managed by Supabase, but you can reference it:

```typescript
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  // This references the Supabase auth.users table
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
});
```

Or create a custom users table for app-specific data:

```typescript
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Store Supabase auth user ID
  authUserId: uuid('auth_user_id').notNull().unique(),
  // Your custom fields
  displayName: text('display_name'),
  preferences: jsonb('preferences'),
});
```

## Querying Patterns

### Server Components (Next.js App Router)

```typescript
// app/users/page.tsx
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export default async function UsersPage() {
  const allUsers = await db.select().from(users);
  
  return (
    <div>
      {allUsers.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Server Actions

```typescript
'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  
  await db.insert(users).values({
    email,
    name,
  });
  
  revalidatePath('/users');
}
```

### API Routes

```typescript
// app/api/users/route.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const allUsers = await db.select().from(users);
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newUser = await db.insert(users).values(body).returning();
  
  return NextResponse.json(newUser[0]);
}
```

## TypeScript Types

Drizzle automatically generates types:

```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, posts } from '@/lib/db/schema';

// Select type (what you get from queries)
export type User = InferSelectModel<typeof users>;

// Insert type (what you need to insert)
export type NewUser = InferInsertModel<typeof users>;

// Use in your code
const user: User = await db.select().from(users).where(eq(users.id, id));

const newUser: NewUser = {
  email: 'test@example.com',
  name: 'Test User',
};
```

## Migrations

### Generate Migration

When you change your schema:

```bash
pnpm db:generate
```

This creates a file like `supabase/migrations/0001_cool_name.sql`.

### Review Migration

Always review generated migrations before applying:

```sql
-- supabase/migrations/0001_add_users_table.sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);
```

### Apply Migration

**Development:**
```bash
pnpm db:push  # Fastest, skips migration files
```

**Production:**
```bash
pnpm supabase:reset  # Runs all migrations
```

## Troubleshooting

### Connection Issues

```bash
# Check if Supabase is running
pnpm supabase:status

# Restart if needed
pnpm supabase:restart
```

### Schema Sync Issues

```bash
# Reset everything
pnpm supabase:reset

# Regenerate and push
pnpm db:generate
pnpm db:push
```

### Type Errors

Make sure to export your schema in `lib/db/schema.ts`:

```typescript
export const users = pgTable('users', { /* ... */ });
// ^^^^^^ Don't forget to export!
```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle with PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Next.js with Drizzle](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon)

## Best Practices

1. **Keep schema organized** - Use multiple files if needed
2. **Always review migrations** - Don't blindly apply them
3. **Use transactions** for complex operations
4. **Index frequently queried columns**
5. **Use enums** for fixed value sets
6. **Type everything** - Leverage TypeScript
7. **Use relations** for cleaner joins
8. **Validate data** before inserting

## Example: Complete CRUD API

```typescript
// app/api/posts/route.ts
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const allPosts = await db.select().from(posts);
  return NextResponse.json(allPosts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPost = await db.insert(posts).values(body).returning();
  return NextResponse.json(newPost[0]);
}

export async function PUT(request: Request) {
  const { id, ...data } = await request.json();
  const updated = await db
    .update(posts)
    .set(data)
    .where(eq(posts.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await db.delete(posts).where(eq(posts.id, id));
  return NextResponse.json({ success: true });
}
```


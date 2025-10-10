# Quick Start Guide

Get up and running in 5 minutes! ⚡

## 🚀 Setup (3 minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd bitcraft-nexus
pnpm install  # ← This does ALL the setup automatically!

# 2. Start developing
pnpm dev
```

**That's it!** The postinstall script automatically:

- ✅ Starts Supabase local instance
- ✅ Generates `.env.local` with credentials
- ✅ Configures database connections
- ✅ Sets up git hooks

## 📖 Your First Feature (2 minutes)

### Example: Add a "tasks" table

**1. Define schema** (`lib/db/schema.ts`):

```typescript
import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    completed: boolean("completed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});
```

**2. Push to database:**

```bash
pnpm db:push
```

**3. Use in your app** (`app/tasks/page.tsx`):

```typescript
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';

export default async function TasksPage() {
  const allTasks = await db.select().from(tasks);

  return (
    <div>
      <h1>Tasks</h1>
      {allTasks.map(task => (
        <div key={task.id}>
          <input type="checkbox" checked={task.completed} />
          {task.title}
        </div>
      ))}
    </div>
  );
}
```

**Done!** You have a working database-backed feature.

## 🎯 Common Patterns

### Pattern: Create with Server Action

```typescript
"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function createTask(formData: FormData) {
    const title = formData.get("title") as string;

    await db.insert(tasks).values({ title });

    revalidatePath("/tasks");
}
```

### Pattern: Update

```typescript
import { eq } from "drizzle-orm";

await db.update(tasks).set({ completed: true }).where(eq(tasks.id, taskId));
```

### Pattern: Delete

```typescript
await db.delete(tasks).where(eq(tasks.id, taskId));
```

### Pattern: With Authentication

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  // Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Query their data
  const userTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, user.id));

  return <div>{/* ... */}</div>;
}
```

## 🛠️ Essential Commands

```bash
# Development
pnpm dev                  # Start dev server

# Database
pnpm db:push             # Push schema changes (dev)
pnpm db:generate         # Generate migration (production)
pnpm db:studio           # Visual database browser

# Supabase
pnpm supabase:status     # Check if running
pnpm supabase:stop       # Stop containers
pnpm supabase:start      # Start containers
```

## 📚 Next Steps

1. **Learn the workflow** → [Development Workflow Guide](./DEVELOPMENT_WORKFLOW.md)
2. **Understand the architecture** → [Database Architecture](./DATABASE_ARCHITECTURE.md)
3. **Deep dive into Drizzle** → [Drizzle ORM Guide](./DRIZZLE_GUIDE.md)

## 🎓 Key Concepts

### 1. Two Clients, Same Database

```typescript
// Drizzle = Type-safe queries
import { db } from "@/lib/db";
const tasks = await db.select().from(tasks);

// Supabase = Auth, Storage, Realtime
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
const {
    data: { user },
} = await supabase.auth.getUser();
```

Both connect to the **same PostgreSQL database**!

### 2. Development vs Production

**Development:**

```bash
# Edit schema → Push → Test (no migration files)
pnpm db:push
```

**Production:**

```bash
# Edit schema → Generate migration → Review → Commit
pnpm db:generate
git add supabase/migrations/
git commit -m "feat(db): add tasks table"
```

### 3. Server-Side Only

Database queries work in:

- ✅ Server Components
- ✅ Server Actions
- ✅ API Routes

Not in client components:

- ❌ `'use client'` components

## 🎨 Project Structure

```
bitcraft-nexus/
├── app/                    # Next.js app
│   ├── page.tsx           # Server components
│   └── actions.ts         # Server actions
├── lib/
│   ├── db/
│   │   ├── index.ts       # Drizzle instance
│   │   └── schema.ts      # ← Define tables here
│   └── supabase/
│       ├── client.ts      # Client-side Supabase
│       └── server.ts      # Server-side Supabase
├── supabase/
│   ├── migrations/        # Generated migrations
│   └── config.toml        # Supabase config
├── docs/                  # Documentation
└── scripts/               # Setup automation
```

## ⚡ Tips

1. **Use `db:studio`** - Visual database browser is amazing for debugging
2. **Start simple** - Add one table at a time
3. **Use types** - Export types from your schema
4. **Server actions** - Great for mutations
5. **Read the workflow guide** - Shows real-world patterns

## 🆘 Need Help?

- **Setup issues?** → [Setup Troubleshooting](./SETUP_TROUBLESHOOTING.md)
- **How do I...?** → [Development Workflow](./DEVELOPMENT_WORKFLOW.md)
- **Architecture questions?** → [Database Architecture](./DATABASE_ARCHITECTURE.md)

## 🎉 You're Ready!

You now have:

- ✅ Local Supabase running
- ✅ Drizzle ORM configured
- ✅ Type-safe database queries
- ✅ Automated setup
- ✅ Conventional commits enforced

Start building! 🚀

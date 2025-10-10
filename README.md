<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
    - App Router
    - Pages Router
    - Middleware
    - Client
    - Server
    - It just works!
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries with PostgreSQL
- **supabase-ssr** - A package to configure Supabase Auth to use cookies
- **Automated local setup** - Run `pnpm install` and you're ready to code
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- **Conventional Commits** enforcement with commitlint and husky
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
    - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

### Automated Setup (Recommended)

This project features automated local development setup with Supabase:

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd bitcraft-nexus
    ```

2. **Install dependencies** (this automatically sets everything up!)

    ```bash
    pnpm install
    ```

    The postinstall script will automatically:
    - Initialize Supabase local development
    - Start Supabase containers (Docker required)
    - Generate `.env.local` with local credentials
    - Set up any other configured dependencies

3. **Start the development server**

    ```bash
    pnpm dev
    ```

    The app should now be running on [localhost:3000](http://localhost:3000/).

4. **Access Supabase Studio** (optional)

    Visit [http://127.0.0.1:54323](http://127.0.0.1:54323) to manage your local database.

### Manual Setup (Alternative)

If you prefer manual setup or the automated setup fails:

1. Clone the repository and install dependencies:

    ```bash
    git clone <repository-url>
    cd bitcraft-nexus
    pnpm install --ignore-scripts
    ```

2. Set up Supabase manually:

    ```bash
    pnpm run setup:supabase
    ```

    Or connect to a cloud Supabase project by creating `.env.local`:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
    NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
    ```

    Get these values from [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

3. Start the development server:

    ```bash
    pnpm dev
    ```

### Useful Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server

# Supabase
pnpm supabase:status      # Check Supabase status
pnpm supabase:stop        # Stop Supabase containers
pnpm supabase:restart     # Restart Supabase containers
pnpm supabase:reset       # Reset database to initial state
pnpm run setup:supabase   # Re-run Supabase setup

# Drizzle ORM
pnpm db:generate          # Generate migrations from schema
pnpm db:push              # Push schema to database
pnpm db:studio            # Open Drizzle Studio (database GUI)
```

**Documentation:**

- 📖 [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md) - **Start here!** Day-to-day development guide
- 🏗️ [Database Architecture](./docs/DATABASE_ARCHITECTURE.md) - How Supabase and Drizzle work together
- 📚 [Drizzle ORM Guide](./docs/DRIZZLE_GUIDE.md) - Complete Drizzle API reference
- 🔧 [Setup Troubleshooting](./docs/SETUP_TROUBLESHOOTING.md) - Fix common setup issues

### Requirements

- **Node.js** 20+ and **pnpm**
- **Docker** (for local Supabase development)
- **Git**

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to learn more about Supabase locally.

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. All commits are automatically validated using commitlint and husky.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on commit message format and examples.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)

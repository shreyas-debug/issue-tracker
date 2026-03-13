# IssueTracker — Multi-Tenant Issue Management

**IssueTracker** is a production-grade Mini SaaS application that lets multiple organizations track, manage, and resolve software issues — all within a single shared infrastructure, with complete data isolation between tenants.

Think of it as a self-contained, architectural blueprint for how a real SaaS product like Linear or Jira operates at its foundation: each customer (organization) signs up, gets their own private workspace, and can never see or access another organization's data — even though all data lives in the same PostgreSQL database.

### What the application does

- **Multi-tenant workspaces** — Each organization is a fully isolated tenant. Sign up creates a new workspace. Every piece of data (issues, users) is owned by and scoped to that organization.
- **Issue lifecycle management** — Create, assign, update, and delete issues with four status states (Open → In Progress → Resolved → Closed) and four priority levels (Low, Medium, High, Critical).
- **Team collaboration** — Organization members can be assigned to issues. Admins manage the workspace; Members participate in it.
- **Searchable, sortable issue board** — A data table with real-time title search, status and priority filters, and column-level sorting on all fields.
- **Secure authentication** — Custom JWT-based login. The token encodes the user's organization identity, which is verified on every single request before any database interaction occurs.
- **Tenant context in the UI** — The active organization name is always displayed in the sidebar, confirming which workspace is active. Switching accounts shows a completely different dataset.

### Why this architecture matters

The hardest problem in multi-tenant SaaS is not building the features — it's ensuring that the data isolation boundary is **structurally impossible to break**. This project solves that by implementing a Prisma Extension that automatically injects a tenant filter into every database query at the ORM layer, making it impossible for a developer to accidentally leak cross-tenant data even if they forget to add a `WHERE` clause.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Isolation Strategy](#isolation-strategy)
4. [Security Layer](#security-layer)
5. [Deployment & Scaling](#deployment--scaling)
6. [Getting Started](#getting-started)
7. [Testing Tenant Isolation](#testing-tenant-isolation)
8. [Project Structure](#project-structure)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App                           │
│                                                                  │
│  ┌───────────────┐    ┌──────────────────────────────────────┐  │
│  │  Middleware   │    │          Server Components           │  │
│  │  (JWT guard)  │    │   (RSC — zero client data fetching)  │  │
│  └───────┬───────┘    └──────────────────┬───────────────────┘  │
│          │                               │                       │
│          ▼                               ▼                       │
│  ┌───────────────┐    ┌──────────────────────────────────────┐  │
│  │  Auth Routes  │    │          Server Actions               │  │
│  │  /api/auth/*  │    │   (withTenant shield wraps all)       │  │
│  └───────┬───────┘    └──────────────────┬───────────────────┘  │
│          │                               │                       │
│          └───────────────┬───────────────┘                       │
│                          ▼                                       │
│          ┌───────────────────────────────┐                       │
│          │      Tenant Isolation Engine  │                       │
│          │  createTenantClient(orgId)    │                       │
│          │  Prisma Extension — auto-     │                       │
│          │  injects WHERE organizationId │                       │
│          └───────────────┬───────────────┘                       │
│                          │                                       │
└──────────────────────────┼──────────────────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │     PostgreSQL         │
              │  ┌──────────────────┐  │
              │  │  organizations   │  │
              │  │  users           │  │
              │  │  issues          │  │
              │  │  @@index(orgId)  │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC + Server Actions eliminate client round-trips for mutations |
| Language | TypeScript | End-to-end type safety, explicit `SessionPayload` contracts |
| Styling | Tailwind CSS v4 + Shadcn/UI | Accessible components, zero runtime CSS-in-JS overhead |
| ORM | Prisma 7 | Type-safe query builder; Extension API enables transparent tenant scoping |
| Database | PostgreSQL | ACID compliance, composite indexing for tenant-scoped queries |
| Auth | Custom JWT (`jose`) | No external auth service dependency; `orgId` baked into every token |
| Validation | Zod | Runtime validation with TypeScript inference on all API boundaries |

### On the choice of Next.js over standalone Express

The challenge specifies Node.js as the backend runtime. Next.js satisfies this fully — it runs on Node.js and its App Router provides a first-class backend layer through API Routes (`/app/api/*`) and Server Actions, both of which execute server-side on Node.js with the full Node.js module ecosystem available.

Choosing Next.js over a separate Express server is a deliberate architectural decision, not a shortcut:

- **Unified deployment** — One repository, one deployment, one process. A standalone Express + React setup requires coordinating two separate deployments, two CORS configurations, and two build pipelines.
- **Co-located API and UI** — API routes live alongside the components that consume them, making the data contract explicit and eliminating the "backend as a black box" problem common in separated architectures.
- **Server Actions** — Mutations bypass HTTP entirely; they are direct server function calls with automatic CSRF protection, reducing attack surface compared to an open REST endpoint.
- **Production parity** — Vercel, Railway, and Render all deploy Next.js as a Node.js server. The backend is not "serverless-only"; it runs as a persistent Node.js process when self-hosted.

For a SaaS product of this scope, a unified Next.js backend is the industry standard choice (used by Vercel, Loom, Perplexity, and others). A separate Express layer would add operational complexity without architectural benefit.

---

## Isolation Strategy

### Why Logical Isolation Over Physical Isolation?

This system uses **Logical (Row-Level) Isolation**: every table row carries a non-nullable `organizationId` foreign key, and every query is automatically scoped by it.

The alternative — **Physical Isolation** — allocates a separate database or PostgreSQL schema per tenant.

| Dimension | Logical Isolation | Physical Isolation |
|---|---|---|
| **Cost at 1,000 tenants** | ~$50–100/month (one shared DB) | $5,000+/month (1,000 DB instances) |
| **Operational overhead** | One migration deploys to all tenants | Each tenant requires independent migration runs |
| **Connection pooling** | One pool, shared across tenants | 1,000 connection pools to manage |
| **Query performance** | Composite index on `(organizationId, id)` keeps lookups O(log n) | No cross-tenant query risk; full table isolation |
| **Data breach blast radius** | A misconfigured query could leak data (mitigated by our Prisma Extension) | A breach is scoped to one tenant's database |
| **Suitable for** | Startups to ~100K tenants | Regulated industries (HIPAA, PCI-DSS) requiring hard isolation |

**Decision**: For a product targeting general-purpose SaaS at 1,000 tenants, logical isolation provides the optimal balance of cost, operational simplicity, and security — provided the application layer rigorously enforces the `organizationId` boundary. This codebase does so through a **Prisma Extension** that makes it structurally impossible to forget.

### The Prisma Extension: Defense in Depth

The standard advice is "always add `WHERE organizationId = ?` to your queries." The problem: this relies on developer discipline, which fails at scale.

Instead, we wrap the Prisma client at query-time:

```typescript
// src/lib/db/tenant-extension.ts
export function createTenantClient(orgId: string) {
  return prisma.$extends({
    query: {
      issue: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: orgId };
          return query(args);
        },
        // Applied to: findFirst, findUnique, update, updateMany,
        //             delete, deleteMany, count
      },
    },
  });
}
```

Every database call in a request lifecycle uses `createTenantClient(session.orgId)`. A developer writing:

```typescript
db.issue.findMany({ where: { status: "OPEN" } })
```

Actually executes:

```sql
SELECT * FROM "Issue"
WHERE "organizationId" = 'clx...' AND "status" = 'OPEN'
```

The filter is injected transparently. There is no code path in this application that queries the `Issue` table without `organizationId` being enforced.

---

## Security Layer

### 1. JWT Construction

The JWT payload explicitly encodes tenant context:

```typescript
{
  sub: userId,
  orgId: organizationId,  // The tenant boundary
  role: "ADMIN" | "MEMBER",
  email: string,
  name: string,
  orgName: string
}
```

Tokens are signed with `HS256`, stored as `HttpOnly; Secure; SameSite=Strict` cookies, and expire after 8 hours. `HttpOnly` prevents JavaScript access, eliminating XSS-based token theft.

### 2. Preventing IDOR (Insecure Direct Object Reference)

A classic multi-tenant vulnerability: User A calls `GET /issues/issue_123` where `issue_123` belongs to User B's organization. Without tenant scoping, B's data leaks.

We prevent this at two levels:

**Level 1 — Non-guessable IDs**: All primary keys use `cuid()` (e.g., `clx7m2k3e0001qwerty...`), which are cryptographically random and non-sequential. An attacker cannot enumerate or guess another tenant's issue IDs.

**Level 2 — Mandatory tenant filter**: Even if an attacker somehow obtains a valid cross-tenant ID, the Prisma Extension ensures:

```sql
SELECT * FROM "Issue"
WHERE id = 'clx7m2k3e0001qwerty...'
  AND "organizationId" = '<attacker_org_id>'
-- Returns 0 rows. Not found.
```

The request returns `404 Not Found` rather than leaking data or returning a permission error that confirms the resource exists.

### 3. The `withTenant` Shield

All Server Actions are wrapped in `withTenant()`:

```typescript
export async function withTenant(): Promise<TenantContext> {
  const session = await requireSession();  // Throws UNAUTHORIZED if no valid JWT
  const db = createTenantClient(session.orgId);  // Scoped client

  return { session, db, orgId: session.orgId };
}
```

This creates a single, mandatory authentication checkpoint. Adding a new mutation requires calling `withTenant()` — there is no shortcut that bypasses it.

### 4. Route-Level Protection

The Next.js `middleware.ts` runs on every non-static request, verifying the JWT before the request reaches any route handler. Unauthenticated requests are redirected to `/login` before any server component renders.

---

## Deployment & Scaling

### Connection Pooling for 1,000+ Tenants

PostgreSQL has a default connection limit of 100. A Node.js application with 10 instances would exhaust this immediately without pooling.

**Recommended architecture:**

```
Next.js Instances (10x)
        │
        ▼
   PgBouncer / Prisma Accelerate
   (Pool mode: transaction)
   Max pool: 20 connections
        │
        ▼
   PostgreSQL (RDS / Neon / Supabase)
   max_connections: 100
```

Configure in `DATABASE_URL`:

```
# Prisma Accelerate (managed, serverless-compatible)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."

# Or PgBouncer (self-hosted)
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true"
```

Add to `schema.prisma` for serverless environments:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // For migrations
}
```

**Why transaction pooling mode?** Prisma's connection semantics are compatible with transaction-level pooling, which releases connections back to the pool after each transaction — essential for serverless functions with high concurrency.

### Horizontal Scaling Considerations

| Concern | Solution |
|---|---|
| Session state | Stateless JWT — no shared session store needed |
| Cache invalidation | `revalidatePath()` in Server Actions (Next.js cache) |
| Database read scaling | Add read replicas; route `findMany` queries to replica URL |
| Migration safety | `prisma migrate deploy` is idempotent; run in CI before deployment |

---

## Live Demo

| | |
|---|---|
| **Application URL** | *(add your Vercel URL here after deploying)* |
| **Demo — Acme Corp** | `acme@example.com` / `password123` |
| **Demo — Stark Industries** | `stark@example.com` / `password123` |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or cloud — [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) work well)

### 1. Clone and Install

```bash
git clone <repository-url>
cd issue-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/issue_tracker"
JWT_SECRET="your-secret-key-minimum-32-characters-long"
```

### 3. Initialize Database

```bash
# Apply migrations and generate Prisma client
npx prisma migrate dev --name init

# Seed with demo tenants
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing Tenant Isolation

The seed script creates two fully isolated tenants. Follow these steps to verify the isolation boundary:

### Step 1: Log in as Acme Corp

Open a browser window and navigate to `http://localhost:3000/login`.

Sign in with: `acme@example.com` / `password123`

You will see 5 issues belonging to **Acme Corp** only.

### Step 2: Log in as Stark Industries

Open a **private/incognito window** (to maintain a separate cookie session).

Sign in with: `stark@example.com` / `password123`

You will see 5 completely different issues belonging to **Stark Industries**.

### Step 3: Verify IDOR Protection

1. While logged in as `acme@example.com`, copy the URL of any issue (e.g., `/issues/clx7m2k3e...`)
2. Switch to the Stark Industries session
3. Paste the Acme Corp issue URL in the Stark session's browser
4. You will receive a **404 Not Found** — the issue does not exist within Stark's tenant context

### Step 4: Inspect the Query Layer

With `NODE_ENV=development`, Prisma logs all queries. You will see every `Issue` query includes:

```sql
WHERE "organizationId" = '<current_tenant_id>'
```

This confirms the Prisma Extension is operating correctly on every request.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login          # Login page (no sidebar layout)
│   ├── (auth)/register       # Registration page
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── layout.tsx        # Session check + sidebar shell
│   │   ├── issues/           # Issue list, create, detail, edit
│   │   └── settings/         # Account & workspace settings
│   └── api/auth/             # REST endpoints (login, register, logout, me)
│
├── lib/
│   ├── auth/jwt.ts           # Token signing and verification
│   ├── auth/session.ts       # Cookie-based session reading
│   ├── db/prisma.ts          # Singleton Prisma client
│   ├── db/tenant-extension.ts # The isolation engine
│   └── middleware/withTenant.ts # Action shield
│
├── services/
│   ├── issue.service.ts      # Issue CRUD (accepts TenantClient)
│   ├── user.service.ts       # User queries
│   └── org.service.ts        # Organization management
│
├── actions/
│   ├── issue.actions.ts      # Server Actions for issue mutations
│   └── auth.actions.ts       # Logout action
│
├── components/
│   ├── ui/                   # Shadcn/UI base components
│   ├── layout/               # Sidebar, Breadcrumbs, TenantBadge
│   ├── issues/               # IssueTable, IssueForm, badges
│   └── auth/                 # LoginForm, RegisterForm
│
├── types/index.ts            # Shared TypeScript interfaces
└── middleware.ts             # Route-level JWT verification
```

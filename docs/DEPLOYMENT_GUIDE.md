# 🚀 School ERP — Production Deployment Guide
### Target: 500 Concurrent Users | Budget: ₹0/month

> This guide takes your app from local SQLite dev to a production-grade distributed system
> across free-tier cloud services. Follow every step in order.

---

## Architecture Overview

```
                        ┌──────────────────────────────────────┐
  Users ──HTTPS──▶      │                                 └──────────┬───────────────────────────┘
                                   │  Prisma / Shard Routing
                          ┌────────┴────────┐
                          │                 │
                    ┌──────▼──────┐   ┌──────▼──────┐
                    │  (Cloud A)  │   │  (Cloud B)  │
                    │  Vercel API │   │  Railway    │
                    │  shard-1    │   │  shard-2    │
                    └─────────────┘   └─────────────┘

          Databases (Neon)            Cache / Infra (Upstash)
    ┌───────────────────────┐      ┌───────────────────────────┐
    │  Neon PRIMARY (Main)  │      │   Upstash Redis           │
    │  Neon REPLICA (Read)  │      │   Rate-Limit · Bloom · DL │
    └───────────────────────┘      └───────────────────────────┘
```

## 📂 Source-to-Infrastructure Mapping

Which part of your code runs on which service?

| Local Folder / File | Deployed To | Role in Production |
|:---|:---|:---|
| `src/app/` | **Vercel** | Frontend Pages & API Routes (Serverless) |
| `src/lib/db/` | **Neon DB** | Database logic, Caching layer, Sharding |
| `src/lib/auth/` | **Vercel** | JWT signing, Session validation, Middleware |
| `src/lib/infra/` | **Upstash** | Redis connectivity for Rate-limiting & Locking |
| `src/lib/observability/` | **Vercel / Sentry** | Performance metrics & Error tracking |
| `prisma/schema.prisma` | **Neon DB** | Defines the SQL tables structure |
| `public/` | **Vercel Edge** | Static assets (Logo, Favicon) |

**Phase 1 (today):** Single Vercel deployment + Neon Primary + Neon Read Replica + Upstash Redis  
**Phase 2 (later):** Add Railway/Render shards when you exceed 200 concurrent users

---

## 🧭 Request Data Flow

How a request moves from the user's browser to your database:

1.  **Browser**: User clicks "Login" or "View Students".
2.  **Vercel Edge**: `src/middleware.ts` checks the JWT cookie (using `@/lib/auth/jwt`).
3.  **Vercel API**: The request hits a route (e.g., `src/app/api/schools/[id]/students/route.ts`).
4.  **Security Check**: The route calls `rateLimit()` (in `@/lib/infra/rate-limit`) which talks to **Upstash Redis**.
5.  **Database Access**: 
    *   The route calls `getDb(schoolId, { readOnly: true })` (in `@/lib/db/index.ts`).
    *   The **Shard Router** decides which shard to use.
    *   Prisma connects to the **Neon Read Replica** (pooled) if it's a read query.
6.  **Caching**: Prisma check **Upstash Redis** first for cached queries before hitting the DB.

---

## Step 1 — Switch Prisma from SQLite → PostgreSQL

### 1.1 Update `prisma/schema.prisma`

Open `prisma/schema.prisma` and change the `datasource` block:

```prisma
// BEFORE (local dev)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// AFTER (production PostgreSQL)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Primary (writes)
  directUrl = env("DATABASE_URL_DIRECT") // Direct connection (migrations only)
}
```

> **Why `directUrl`?** Neon uses a connection pooler by default. Prisma migrations need a
> direct (non-pooled) connection. The `directUrl` is used only for `prisma migrate deploy`.

---

## Step 2 — Set Up Neon PostgreSQL (Free Tier)

Neon gives you **1 database, 0.5 GB storage, 10 GB transfer/month** — free forever.

### 2.1 Create Primary Database

1. Go to **[neon.tech](https://neon.tech)** → Sign Up (free)
2. Click **"New Project"**
   - Project name: `school-erp`
   - Region: **Asia Pacific (Singapore)** ← closest to India
   - PostgreSQL version: 17
3. Click **"Create Project"**
4. You'll see a connection string — **copy it**, it looks like:
   ```
   postgresql://school_erp_owner:<password>@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Go to **Connection Details** → click **"Pooled connection"** toggle ON
6. Copy the **pooled** connection string (this is your `DATABASE_URL`)
7. Copy the **direct** connection string (this is your `DATABASE_URL_DIRECT`)

### 2.2 Create Read Replica (Neon Branch = Free Read Replica)

Neon's branches are read replicas — **free on all plans**.

1. In your Neon dashboard → **Branches** tab
2. Click **"New Branch"**
   - Name: `read-replica`
   - Branch from: `main` (your primary)
   - ✅ **"Read replica"** checkbox ON
3. Click **"Create Branch"**
4. Go to the `read-replica` branch → Connection Details
5. Copy its **pooled** connection string → this is your `DATABASE_URL_REPLICA`

---

## Step 3 — Set Up Upstash Redis (Free Tier)

Upstash gives you **10,000 commands/day** free — enough for ~500 users.

1. Go to **[upstash.com](https://upstash.com)** → Sign Up
2. Click **"Create Database"**
   - Name: `school-erp-cache`
   - Type: **Regional**
   - Region: **AP-Southeast-1 (Singapore)**
   - ✅ Enable **TLS**
3. Click **"Create"**
4. Go to **REST API** tab
5. Copy:
   - `UPSTASH_REDIS_REST_URL` → `https://xxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` → `AXxx...`

---

## Step 4 — Configuration in `src/lib/db/`

Since the folder structure was reorganized for optimization, update your configuration in the new locations:

### 4.1 Update `src/lib/db/index.ts` (Primary + Replica)

Open `src/lib/db/index.ts` and ensure the shard configuration uses environment variables:

```typescript
// src/lib/db/index.ts (REPLACE the shards array)

const shards: (ShardNode & { primary: string; replica?: string })[] = [
  {
    id: 'shard-1',
    weight: 2,
    primary: process.env.DATABASE_URL!,           // Neon Primary (pooled)
    replica: process.env.DATABASE_URL_REPLICA     // Neon Read Replica (pooled)
              || process.env.DATABASE_URL!,        // fallback to primary if no replica
  },
];
```

Also update `createExtendedClient` — remove `pgbouncer=true` from the code
since Neon's pooled URL already handles this:

```typescript
function createExtendedClient(url: string, weight: number = 1) {
  let pooledUrl = url;

  // For PostgreSQL: set connection limit based on shard weight
  // Neon's pooled endpoint handles pgbouncer — don't add it manually
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    const connectionLimit = Math.max(10, Math.floor(25 * weight));
    if (!pooledUrl.includes('connection_limit=')) {
      pooledUrl = pooledUrl.includes('?')
        ? `${pooledUrl}&connection_limit=${connectionLimit}`
        : `${pooledUrl}?connection_limit=${connectionLimit}`;
    }
  }

  return new PrismaClient({
    datasources: { db: { url: pooledUrl } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(redisCacheExtension);
}
```

---

## Step 5 — Deploy Frontend + API on Vercel (Free Tier)

Vercel free tier: **100 GB bandwidth, unlimited deployments, Edge Functions**.

### 5.1 Push to GitHub

```bash
# In your project root:
git init
git add .
git commit -m "feat: production-ready school ERP"

# Create a repo on github.com then:
git remote add origin https://github.com/<your-username>/school-erp.git
git push -u origin main
```

### 5.2 Connect to Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign Up with GitHub
2. Click **"New Project"** → Import your `school-erp` repo
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `school-erp-system-main` ← **important, set this correctly**
5. Do NOT deploy yet — add env vars first (next step)

### 5.3 Add Environment Variables on Vercel

In Vercel project settings → **Environment Variables**, add ALL of these:

```bash
# === DATABASE ===
DATABASE_URL=postgresql://<user>:<pass>@<pooled-host>/neondb?sslmode=require
DATABASE_URL_DIRECT=postgresql://<user>:<pass>@<direct-host>/neondb?sslmode=require
DATABASE_URL_REPLICA=postgresql://<user>:<pass>@<replica-pooled-host>/neondb?sslmode=require

# === REDIS ===
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# === APP ===
JWT_SECRET=<generate a 64-char random string — see below>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# === IMAGEKIT (already have these) ===
IMAGEKIT_PUBLIC_KEY=public_mFy/A7hYYFFbBTz98R3neYs8Ulk=
IMAGEKIT_PRIVATE_KEY=private_KvDfB20MtS0C8gDAykGo9TQ8UQ8=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/mpswbagub
```

**Generate JWT_SECRET:**
```bash
# Run this in any terminal (or use any online UUID generator × 2):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5.4 Deploy

Click **"Deploy"** in Vercel. First build takes ~3-4 minutes.

---

## Step 6 — Run Database Migrations

After Vercel deploys successfully, run migrations from your local machine:

```bash
# In your project directory:

# 1. Set your production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://<user>:<pass>@<DIRECT-host>/neondb?sslmode=require"
$env:DATABASE_URL_DIRECT="postgresql://<user>:<pass>@<DIRECT-host>/neondb?sslmode=require"

# 2. Push schema to PostgreSQL (first time — creates all tables)
npx prisma db push

# 3. Verify tables were created
npx prisma studio
# Opens browser UI — check your tables are there
```

> **Note:** Use the `DATABASE_URL_DIRECT` (non-pooled) URL for running migrations locally.
> The pooled URL is only for the deployed app.

---

## Step 7 — Create Your First Admin User

After migrations, seed an admin user:

```bash
# Run this once with your DIRECT database URL set:
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  const hash = await bcrypt.hash('Admin@1234', 10);
  
  // Create school first
  const school = await db.school.create({
    data: { name: 'My School', isActive: true }
  });
  
  // Create admin user
  await db.user.create({
    data: {
      email: 'admin@myschool.com',
      password: hash,
      name: 'School Admin',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
      isActive: true,
    }
  });
  
  console.log('Admin created! SchoolID:', school.id);
  await db.\$disconnect();
}

seed().catch(console.error);
"
```

---

## Step 8 — Update `next.config.ts` for ImageKit CSP

Your `next.config.ts` already has ImageKit in CSP. Verify it includes your Vercel domain:

```typescript
// In next.config.ts, update the connect-src line:
"connect-src 'self' https://ik.imagekit.io https://*.sentry.io https://*.vercel.app",
```

---

## Step 9 — Verify Deployment

### 9.1 Check Login Works

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Log in with `admin@myschool.com` / `Admin@1234`
3. You should land on `/dashboard/<school-id>`

### 9.2 Check Redis is Active

In Vercel logs (Dashboard → Functions → Logs), you should see:
```
[Redis] Configured and active ✓
```
And NOT see:
```
[Redis] Not configured or using placeholder values
```

### 9.3 Check Read Replica Routing (src/lib/db/index.ts)

Verify that your read-only API calls are indeed hitting the replica:
```bash
# Test the students API — should return 200 with real data
# This route in src/app/api/schools/[school_id]/students/route.ts 
# now uses getDb(school_id, { readOnly: true }) internally.
curl -H "Cookie: token=<your-jwt>" \
  https://your-app.vercel.app/api/schools/<school-id>/students
```

---

## Phase 2 — Adding Backend Shards (When You Need It)

> **You only need this when you exceed ~200 concurrent users consistently.**
> For 500 users, Vercel + Neon + Upstash handles it fine.
> But here's the plan when you need to scale further:

### Architecture with 3 Shards

```
Vercel (Edge Middleware routes by schoolId)
    │
    ├── schoolId hash → shard-1 → Railway App (DB: Neon Primary)
    ├── schoolId hash → shard-2 → Render App  (DB: Neon Shard 2)
    └── schoolId hash → shard-3 → Railway App (DB: Neon Shard 3)
```

### Railway Deployment (Shard B)

1. Go to **[railway.app](https://railway.app)** → Sign Up
2. **"New Project"** → **"Deploy from GitHub"** → select your repo
3. Add all the same environment variables PLUS:
   ```bash
   DATABASE_URL=<Neon Shard 2 URL>
   DATABASE_URL_REPLICA=<Neon Shard 2 Replica URL>
   SHARD_ID=shard-2
   PORT=3000
   ```
4. In Railway → Settings → **Custom Start Command**:
   ```bash
   npm run build && npm start
   ```
5. Get the Railway **public URL** (e.g. `https://school-erp-shard2.up.railway.app`)

### Render Deployment (Shard C)

1. Go to **[render.com](https://render.com)** → Sign Up
2. **"New Web Service"** → Connect GitHub → select repo
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add environment variables (same as Railway but with `DATABASE_URL_SHARD3`)
6. Get the Render public URL

### Update Vercel Middleware for Shard Routing

Once you have shard URLs, update `src/middleware.ts` or create a new routing layer:

```typescript
// Add to .env on Vercel:
SHARD_1_URL=https://your-app.vercel.app          // Vercel handles shard-1
SHARD_2_URL=https://school-erp-shard2.up.railway.app
SHARD_3_URL=https://school-erp.onrender.com

// In middleware.ts, route API calls to the right shard:
const shardUrl = getShardUrl(schoolId); // uses your ConsistentHash
if (shardUrl !== process.env.SHARD_1_URL) {
  return NextResponse.rewrite(new URL(pathname, shardUrl));
}
```

---

## Environment Variable Reference

### `.env.production` (keep this file LOCAL, never commit)

```bash
# ============================================================
# DATABASE — Neon PostgreSQL
# ============================================================
# Primary (pooled — for app runtime)
DATABASE_URL="postgresql://school_erp_owner:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Direct (non-pooled — for prisma migrations only)
DATABASE_URL_DIRECT="postgresql://school_erp_owner:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Read Replica (pooled — for read queries)
DATABASE_URL_REPLICA="postgresql://school_erp_owner:<password>@ep-xxx-replica.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# ============================================================
# CACHE — Upstash Redis
# ============================================================
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."

# ============================================================
# APP CONFIG
# ============================================================
JWT_SECRET="<64-char-hex-string>"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# ============================================================
# IMAGEKIT (already configured)
# ============================================================
IMAGEKIT_PUBLIC_KEY="public_mFy/A7hYYFFbBTz98R3neYs8Ulk="
IMAGEKIT_PRIVATE_KEY="private_KvDfB20MtS0C8gDAykGo9TQ8UQ8="
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/mpswbagub"

# ============================================================
# MONITORING (optional but recommended)
# ============================================================
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```

---

## Capacity Planning

### What Can Each Free Tier Handle?

| Service | Free Limits | Concurrent Users |
|:---|:---|:---:|
| **Vercel** | 100GB bandwidth, unlimited functions | 500+ |
| **Neon Primary** | 0.5GB storage, 60 connections | 200 writes/sec |
| **Neon Replica** | 0.5GB, 60 connections | 400 reads/sec |
| **Upstash Redis** | 10,000 cmds/day | 100-200/day heavy users |
| **ImageKit** | 20GB storage, 20GB bandwidth | Unlimited (CDN) |

### Upstash Command Budget

At 500 users, typical usage per login session:
- Login: 2 Redis commands (rate limit check + bloom filter)
- Each page load: 1-2 commands (cache check)
- **~10 commands/user/session** avg

With 500 users × 10 commands = 5,000 commands/day → **within free tier (10,000/day)**

### When to Upgrade

| Metric | Action |
|:---|:---|
| Neon connections > 50 | Upgrade Neon to Launch ($19/mo) for 1,000 connections |
| Upstash > 8,000 cmds/day | Upgrade Upstash to Pay-as-you-go ($0.20/100k cmds) |
| Vercel bandwidth > 80GB/mo | Upgrade Vercel to Pro ($20/mo) |
| Response P99 > 500ms | Add Railway/Render shard (Phase 2) |

---

## Deployment Checklist

### Before Deploying

- [ ] Prisma schema `provider` changed from `sqlite` → `postgresql`
- [ ] `src/lib/db/index.ts` uses env vars for shard URLs (not hardcoded)
- [ ] `.gitignore` includes `.env*` (never commit credentials)
- [ ] `JWT_SECRET` is a strong random 64-char string (not the dev default)

### After Deploying

- [ ] Login works on production URL
- [ ] Admin dashboard loads
- [ ] Redis shows as configured in Vercel logs
- [ ] ImageKit image uploads work
- [ ] `/api/health` returns 200 (or create one)
- [ ] `npx prisma db push` reports no schema drift

### Security Before Going Live

- [ ] Change default admin password immediately after first login
- [ ] Set `NODE_ENV=production` in Vercel (disables error stack traces)
- [ ] Sentry DSN configured (errors will be caught)
- [ ] Vercel **Password Protection** disabled (it blocks your users)

---

## Troubleshooting Common Issues

### "Can't reach database server"
```bash
# Test your Neon connection URL (run locally):
npx prisma db execute --stdin <<< "SELECT 1"
# If it fails, check: correct URL? sslmode=require? IP allowlisted?
```

### "Too many connections" error
- You're hitting Neon's free limit (60 connections)
- Solution: Make sure your Neon URL uses the **pooled** endpoint (contains `.pooler.neon.tech`)
- Or: Enable `?pgbouncer=true` on the pooled URL

### Login returns 401 after deployment
- Redis is not configured correctly — check `UPSTASH_REDIS_REST_URL` starts with `https://`
- Check Vercel logs for `[Redis] Not configured` warning

### "Module not found: @prisma/client"
```bash
# Add this to package.json scripts:
"postinstall": "prisma generate"
# Vercel runs postinstall after npm install, so Prisma client gets generated
```

### Prisma migration fails
- Use the **DIRECT** (non-pooled) URL for migrations, not the pooled URL
- Pooled connections don't support DDL statements (CREATE TABLE etc.)

---

*Last updated: 2026-03-29 | School ERP Deployment Team*

# Local Setup (from zero)

This project requires **PostgreSQL** before starting the web app because the homepage reads live data from Prisma on first request.

## 1) Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (or another Docker runtime with `docker compose`)

## 2) Install dependencies

```bash
pnpm install
```

## 3) Environment setup

Files now included:

- [`.env.example`](/Users/macgr/DealOS/.env.example) (template with all required variables)
- [`.env.local`](/Users/macgr/DealOS/.env.local) (local defaults)
- [`apps/web/.env.local`](/Users/macgr/DealOS/apps/web/.env.local) (Next.js app env)
- [`apps/admin/.env.local`](/Users/macgr/DealOS/apps/admin/.env.local) (admin auth env)
- [`packages/database/.env`](/Users/macgr/DealOS/packages/database/.env) (Prisma CLI env)

If you want different credentials/ports, update all `DATABASE_URL` values consistently.

## 4) Start PostgreSQL (local)

Use [docker-compose.yml](/Users/macgr/DealOS/docker-compose.yml):

```bash
docker compose up -d postgres
```

Expected connection:

`postgresql://dealos:dealos@localhost:5432/dealos?schema=public`

## 5) Prisma setup

Run the exact commands from project root:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name local_setup
pnpm prisma db seed
```

Seed script location: [seed.ts](/Users/macgr/DealOS/packages/database/prisma/seed.ts)

Seed includes sample:

- merchants
- products
- deals
- coupons
- categories

## 6) Run web app

```bash
pnpm --filter web dev
```

Then open:

- `http://localhost:3000` (or Next.js fallback port printed in terminal)

If PostgreSQL is running and migrated/seeded, homepage loads without environment validation errors.

## 7) Common failure and fix

### Error: `P1001: Can't reach database server at localhost:5432`

Fix:

1. Ensure Docker is installed and running.
2. Start DB: `docker compose up -d postgres`
3. Re-run:
   - `pnpm prisma migrate dev --name local_setup`
   - `pnpm prisma db seed`
4. Restart web server.

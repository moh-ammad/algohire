# CertiFlow — Current Setup Status

Clear record of what is already done, what is running, and what you still need.

---

## Project layout

```
New folder/
├── backend/          # Node.js + Express + TypeScript + Prisma 7
├── frontend/         # React + Vite 7 + Tailwind
├── .gitignore        # Root ignore (node_modules, .env, dist, generated)
└── SETUP.md          # This file
```

---

## Your Docker services (already running)

You are **not** using Prisma’s local DB. You use your own Docker containers.

### PostgreSQL

| Item | Value |
|------|--------|
| Container | `postgres-18` |
| Image | `postgres:18` |
| Host port | `5432` → container `5432` |
| DB name | `algohire` |
| User | `postgres` |
| Password | `root123` (from `POSTGRES_PASSWORD` on the container) |
| Status | Up — port check succeeded |

### Redis

| Item | Value |
|------|--------|
| Container | `my-redis` |
| Image | `redis:7.4.12` |
| Host port | `6379` → container `6379` |
| Status | Up — `redis-cli ping` → `PONG` |

Connect inside the container (what you already did):

```bash
docker exec -it postgres-18 psql -U postgres -d algohire
```

App connection string lives in `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/algohire?schema=public"
```

**Important:** `docker exec` into Postgres often needs no password. Connecting from the host/app (Prisma) **does** need the password you set when you created the container (`POSTGRES_PASSWORD`).

If the password is not `postgres`, edit `backend/.env` now.

Check what password the container was started with:

```powershell
docker inspect postgres-18 --format "{{range .Config.Env}}{{println .}}{{end}}"
```

Look for `POSTGRES_PASSWORD=...` and put that value in `DATABASE_URL`.

---

## What was done

### Root

- Added global `.gitignore` (deps, build, `.env`, Prisma `generated/`, OS/editor junk)

### Backend (`backend/`)

| Piece | Status |
|-------|--------|
| Express + CORS | Installed |
| TypeScript + `tsx` | Installed, `tsconfig.json` ready |
| Prisma **7.10.1** | Installed + initialized |
| Postgres driver | `pg` + `@prisma/adapter-pg` (required for Prisma 7) |
| Types | `@types/node`, `express`, `cors`, `pg`, `jsonwebtoken`, `bcryptjs` |
| Redis client | `ioredis` |
| Queue (jobs/events) | `bullmq` (uses Redis) |
| Rate limiting | `express-rate-limit` + `rate-limit-redis` |
| Security / validation | `helmet`, `zod`, `bcryptjs`, `jsonwebtoken` |
| Realtime | `socket.io` |
| Prisma schema | `prisma/schema.prisma` (no models yet) |
| Prisma config | `prisma7.config.ts` |
| Generated client | `backend/generated/prisma` (via `prisma generate`) |
| Prisma helper | `src/lib/prisma.ts` |
| Entry | `src/index.ts` — helmet, JSON, Redis-backed rate limit, `/health` |
| Env example | `backend/.env.example` |

**Scripts**

```bash
cd backend
npm run dev              # tsx watch
npm run build            # compile to dist/
npm run prisma:generate  # regenerate client
npm run prisma:migrate   # create/apply migrations
npm run prisma:seed      # demo users (password: password123)
npm run prisma:studio    # DB UI
```

Fresh clone DB: `npx prisma migrate deploy` then `npm run prisma:seed`.

### Frontend (`frontend/`)

| Piece | Status |
|-------|--------|
| React 19 | Already there |
| Tailwind 4 | Already there (`@tailwindcss/vite`) |
| Vite | Downgraded **8 → 7.3.8** (Vite 8 issue) |
| React plugin | `@vitejs/plugin-react@5` (matches Vite 7) |
| Routing | `react-router-dom` |
| Realtime client | `socket.io-client` |

```bash
cd frontend
npm run dev
```

---

## Why these packages (hackathon stack)

From the problem statement — only what we need:

| Requirement | Package / choice |
|-------------|------------------|
| Backend: Express + TypeScript | `express`, `typescript`, `tsx` |
| DB: PostgreSQL + Prisma | your Docker `postgres:18` + Prisma **7** |
| Caching | Redis via `ioredis` (container not added yet) |
| Background jobs / events | `bullmq` on Redis |
| Rate limiting | `express-rate-limit` + Redis store |
| Secure input / auth building blocks | `zod`, `helmet`, `bcryptjs`, `jsonwebtoken` |
| Live updates (no refresh) | `socket.io` / `socket.io-client` |
| Frontend | React + Vite **7** + Tailwind + router |

Not added on purpose yet (add when you build the feature): spreadsheet parser, PDF lib, file upload middleware, WhatsApp mock, full Docker Compose.

---

## What is NOT done yet

1. **Redis container** — rate limit / BullMQ expect Redis at `redis://localhost:6379`. Postgres alone is not enough for the full stack.
2. **Prisma models + migrations** — schema has no tables yet (users, batches, certificates, audit, etc.).
3. **Auth / roles / APIs** — packages only; no business routes yet.
4. **Docker Compose** — brief wants one-command local run; still need compose for Postgres + Redis + app later.
5. Confirm **`DATABASE_URL` password** matches your `postgres-18` container.

---

## Quick verify checklist

```powershell
# 1. Postgres up
docker ps -a
Test-NetConnection localhost -Port 5432

# 2. Fix password in backend\.env if needed

# 3. Backend
cd backend
npm run prisma:generate
npm run dev
# open http://localhost:3000/health

# 4. Frontend
cd frontend
npm run dev
```

---

## Env reference (`backend/.env`)

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/algohire?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-change-me"
PORT=3000
```

- `.env` is gitignored — never commit real passwords.
- Use `.env.example` as the template for teammates.

# CertiFlow — Code Structure (what does what)

Read this when you need to **explain the codebase**.  
Not vibe folders — each path has one job.

---

## Repo overview

```
New folder/
├── PLAN.md          What we’re building + architecture decisions
├── TASK.md          Checklist (Phase 0 → B/F tasks)
├── PROGRESS.md      What is actually finished
├── SETUP.md         How to run Docker / env
├── STRUCTURE.md     This file — folders & responsibility
├── GIT.md           Per-task `git add` lists + commit messages
├── backend/         Express + TS + Prisma API
└── frontend/        React + Vite + Tailwind UI
```

| Doc | Use it to answer |
|-----|------------------|
| `PLAN.md` | Why this architecture? |
| `TASK.md` | What’s next / done? |
| `PROGRESS.md` | What did we finish historically? |
| `SETUP.md` | How do I run it? |
| `STRUCTURE.md` | What is this file for? |
| `GIT.md` | Which files to stage + commit message? |

**Migrate vs generate (don’t confuse):** `generate` = TS client only. `migrate` = SQL tables. B2 did **both**; DB is migrate-managed.

---

## Backend layout (B1 + B2)

```
backend/
├── .env                 Secrets (gitignored) — DB, Redis, JWT, PORT
├── .env.example         Safe template for teammates
├── package.json         Scripts + dependencies
├── tsconfig.json        TypeScript compiler options
├── prisma7.config.ts    Prisma 7 CLI config (DB URL, migrations, seed)
├── prisma/
│   ├── schema.prisma    Domain models + enums
│   ├── seed.ts          Demo users (Anika, Dev, Meera, Kabir, Neha, Farah)
│   └── migrations/      SQL history (Prisma Migrate) — NOW EXISTS
├── generated/prisma/    Prisma Client output (gitignored, from `prisma generate`)
└── src/
    ├── index.ts         BOOT ONLY — listen
    ├── app.ts           Assemble Express: middleware + routes
    ├── config/
    │   └── env.ts       Env validation
    ├── lib/
    │   ├── prisma.ts    Postgres client (Prisma 7 + pg adapter)
    │   ├── redis.ts     Redis client
    │   ├── password.ts  bcrypt hash/verify
    │   └── jwt.ts       Sign/verify access tokens
    ├── middleware/
    │   ├── requestId.ts
    │   ├── rateLimit.ts Redis-backed limits (login uses stricter public limiter)
    │   ├── errorHandler.ts
    │   └── auth.ts      requireAuth + requireRole(...)
    ├── routes/
    │   ├── index.ts     Mounts health + /api/auth
    │   ├── health.ts    /health + /ready
    │   └── auth.ts      login, me, demo-users, state-only
    └── types/
        ├── auth.ts      AuthUser / JwtPayload types
        └── express.d.ts Request.requestId + Request.user
```

### Why split `index.ts` vs `app.ts`?

| File | Job |
|------|-----|
| `app.ts` | Build the Express app — **testable** without opening a port |
| `index.ts` | Process entry — connect, listen, process signals |

### Request flow (B1)

```
HTTP request
  → helmet / cors / json
  → requestId
  → rateLimit (Redis)
  → routes (/health, /ready, later /api/...)
  → errorHandler (if anything throws)
```

### Endpoints (B1 + B2)

| Method | Path | Meaning |
|--------|------|---------|
| GET | `/health` | Process alive |
| GET | `/ready` | Postgres + Redis OK |
| POST | `/api/auth/login` | Email/password → JWT (public rate limit) |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET | `/api/auth/demo-users` | Seed personas for F2 switcher |
| GET | `/api/auth/state-only` | STATE role smoke test (403 otherwise) |

`/health` and `/ready` are **excluded from rate limiting**. Login uses **public** Redis limiter.

### Domain models (B2 migration `init_domain`)

| Model | Purpose |
|-------|---------|
| `District` / `TrainingCentre` | Org geography |
| `User` | Roles: CENTRE / DISTRICT / QUALITY / STATE |
| `Batch` / `Candidate` | Submission workflow (APIs in B3+) |
| `Approval` | Quorum-safe votes (`@@unique` batch+user+stage) |
| `Certificate` | Unique `certNumber` (issuance in B5) |
| `AuditLog` | Who/when traceability |

### Robust + scalable (what to say in review)

| Idea | Where it lives |
|------|----------------|
| Code split | `app.ts` vs `index.ts`; routes / middleware / lib / pages |
| Horizontal scale | Redis rate-limit store (not memory) |
| Fail soft for ops | Ready checks report postgres/redis; health stays cheap |
| Traceability | `X-Request-Id` + `AuditLog` model |
| AuthZ at step | `requireRole` — wrong role cannot act |
| Concurrent approvals ready | Unique approval constraint in schema |
| Clear folders | Anyone opens `STRUCTURE.md` and knows where to look |
| Migrate managed DB | `prisma migrate status` → up to date |

---

## Frontend layout (F1+)

```
frontend/
├── .env.example         VITE_API_URL=http://localhost:3000
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx                 React bootstrap
    ├── App.tsx                  Router only — mounts routes
    ├── index.css                Tailwind + design tokens
    ├── api/
    │   ├── client.ts            fetch helper + API base URL
    │   └── health.ts            /health + /ready calls
    ├── components/
    │   ├── AppShell.tsx         Layout: brand nav + outlet
    │   └── ApiStatus.tsx        Live backend readiness badge
    └── pages/
        ├── HomePage.tsx         Landing / product home
        └── VerifyPage.tsx       Public verify (placeholder until F6)
```

Later F-tasks add: `pages/Centre*`, `pages/Officer*`, `auth/` role switcher.

---

## Docker (your machine — not Compose yet)

| Container | Image | Port | Used by |
|-----------|-------|------|---------|
| `postgres-18` | `postgres:18` | 5432 | Prisma / API |
| `my-redis` | `redis:7.4.12` | 6379 | Rate limit, cache, BullMQ |

---

## What is NOT in the tree yet (by design)

| Later task | Adds |
|------------|------|
| B2 | Auth routes, Prisma models, seed |
| B3 | Batch/upload routes + services |
| B4 | Approval workflow services |
| B5 | `worker.ts` + BullMQ processors |
| B6 | Public verify + cache |
| B8 | `docker-compose.yml` |

When those land, update this file in the same PR/task.

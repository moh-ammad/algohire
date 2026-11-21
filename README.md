# CertiFlow

Skilling certificate issuance — centre upload → district/quality/state approval → WhatsApp mock delivery → public verify.

## Stack

- **Frontend:** React + Vite 7 + Tailwind + shadcn
- **Backend:** Express + TypeScript + Prisma 7 + Postgres + Redis + BullMQ + Socket.IO

## Quick start (teammate path)

### 1. Infra

```bash
docker compose up -d
```

Or reuse existing local containers (`postgres-18` / `my-redis`) — same ports `5432` / `6379`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL password if needed (compose default: root123)

npm install
npx prisma migrate deploy
npm run seed
npm run dev          # terminal A — API :3000
npm run worker       # terminal B — WhatsApp + stuck scan
```

Demo password for all seeded users: **`password123`**

| User | Email | Role |
|------|-------|------|
| Anika | anika@centre.test | CENTRE |
| Dev / Meera / Kabir | *@district.test | DISTRICT |
| Neha | neha@quality.test | QUALITY |
| Farah | farah@state.test | STATE |

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

### 4. Critical tests (needs DB + Redis + seed)

```bash
cd backend
npm test
```

## Happy-path demo (~2 min)

1. Header → **Demo users** → Anika → Centre → New batch → upload `backend/fixtures/candidates-good.csv` → Submit  
2. Dev → Approve · Meera → Approve  
3. Farah → Approve → certificates issue  
4. Keep `npm run worker` running → delivery → **DELIVERED**  
5. **Verify** (no login) → paste cert number → Genuine  
6. Farah → Cancel a cert → Verify again → Cancelled  

Bad spreadsheet: upload `candidates-bad.csv` → errors, **0 rows saved**.

## Env notes

See `backend/.env.example`. Optional: `GEMINI_API_KEY`, `STUCK_IDLE_MINUTES`, `WHATSAPP_MOCK_MODE`.

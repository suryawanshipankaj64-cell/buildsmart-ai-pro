# BuildSmart AI Pro

A full-stack construction cost estimation and project planning platform built
with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL,
NextAuth, and Recharts.

Every number in the UI — KPIs, charts, gauges, tables — is computed live from
what you enter (projects, expenses, tasks, material rates). There are no
hardcoded mock values anywhere in the app.

## 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A PostgreSQL database (local, Docker, Supabase, Neon, Railway, etc.)

## 2. Install

```bash
cd buildsmart-ai-pro
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

- `DATABASE_URL` — your Postgres connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

Optional, to light up the modules that call external services:

- `OPENWEATHER_API_KEY` — Module 7 (Weather Intelligence). Without it the
  weather page shows a clear "not configured" message instead of failing.
- `ANTHROPIC_API_KEY` — Module 8 (AI Chat Assistant). Same graceful fallback.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `AZURE_AD_CLIENT_ID` /
  `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID` — SSO login buttons only
  appear once these are set.

## 4. Set up the database

```bash
npm run db:push      # creates tables from prisma/schema.prisma
npm run db:seed      # seeds the admin-configurable MaterialRate table only
```

## 5. Run

```bash
npm run dev
```

Visit `http://localhost:3000`, register an account (pick a role), and you'll
land on an empty-state dashboard prompting you to create your first project.

## How the modules map to the code

| Module | Where |
|---|---|
| 1. User & Project Management | `app/api/projects`, `app/dashboard/projects` |
| 2. AI-Powered Estimation | `lib/estimation.ts`, `app/api/projects/[id]/estimate`, Estimation tab in project detail |
| 3. AI Project Planning | `app/api/tasks`, Planning tab in project detail |
| 4. AI Risk Analysis | `lib/risk.ts`, Risk tab + `app/dashboard/risk` |
| 5. Budget & Expense Management | `app/api/expenses`, Budget tab + `app/dashboard/budget` |
| 6. Analytics & Reports | `app/dashboard/analytics` |
| 7. Weather Intelligence | `app/api/weather`, `app/dashboard/weather` |
| 8. AI Chat Assistant | `app/api/chat`, `app/dashboard/chat` |
| 9. Documents & Reports | `app/dashboard/documents` (client-side PDF via jsPDF) |
| 10. Site & Field Management | `app/api/photos`, `app/dashboard/site` |
| Admin Rate Management | `app/api/materials`, `app/dashboard/admin/rates` (Admin role only) |

## Notes on the estimation "AI"

`lib/estimation.ts` and `lib/risk.ts` are transparent, tunable rule engines
(standard construction quantity ratios and a weighted risk formula) rather
than a trained ML model — this is what "AI estimation" means in most
construction-tech products at this stage, and it keeps every number
explainable and auditable. If you later want to swap in a real model, both
files are self-contained and easy to replace without touching the UI.

## Known gaps to close before production

- **File uploads**: `SitePhoto.imageUrl` and `Expense.receiptUrl` currently
  expect an already-hosted URL. Wire up direct uploads (S3, Cloudinary,
  UploadThing, etc.) from the browser/mobile client and pass the resulting
  URL into the existing API routes.
- **Voice input / localization** (Module 8) and **push notifications**
  (Module 10) are UI/device-level features best added once you've picked a
  deployment target (PWA vs. native shell) — the notification *data* already
  exists (overdue tasks, risk flags); only the delivery channel is missing.
- **Tests**: none included yet — add integration tests around the API routes
  and unit tests around `lib/estimation.ts` / `lib/risk.ts` first, since
  those are the modules every dashboard number depends on.

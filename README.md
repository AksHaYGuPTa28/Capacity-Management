# Capacity Management Demo

A demonstration web application for managing capacity across teams, people, and projects.
View team capacity, allocate resources, forecast utilization, detect over/under-allocation, and
produce management dashboards. Built as a customer-facing proof of concept, **not** a production
system.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router) + React + TypeScript, Tailwind CSS, Recharts |
| Backend | NestJS (Node/TypeScript) REST API, Prisma ORM |
| Database | PostgreSQL |
| Auth | Mock JWT login (persona picker, no SSO) |
| API docs | OpenAPI/Swagger at `/api/docs` |
| Deployment | Docker Compose (Postgres + backend + frontend) |
| "AI" features | Deterministic, rule-based natural-language Q&A over live capacity data. No external LLM/API key required, so the demo runs fully offline |

## Quick start (Docker Compose)

Requires Docker Desktop.

```bash
docker compose up --build
```

This starts three containers:

- `postgres`: PostgreSQL 16, with a persisted volume
- `backend`: NestJS API on **http://localhost:4000** (Swagger UI at `/api/docs`). On first boot it
  runs Prisma migrations and seeds realistic demo data automatically; on later restarts it detects
  existing data and skips reseeding, so anything you change in the demo persists across restarts.
- `frontend`: Next.js app on **http://localhost:3000**

Open **http://localhost:3000** and pick a demo persona to sign in instantly (no password required).

To wipe and reseed fresh demo data:

```bash
docker compose down -v   # drops the postgres volume
docker compose up --build
```

## Demo logins

All seeded accounts use the password `demo1234` if you use the manual email/password form. The
login screen also offers one-click "demo login" for any seeded persona, no password needed.

| Role | Email |
| --- | --- |
| Administrator | `admin@demo.io` |
| Resource Manager | `rita@demo.io`, `ravi@demo.io` |
| Team Manager | one per team, see `GET /auth/demo-users` or the login screen |
| Viewer / Executive | `viewer@demo.io` |

## Seed data

Running the seed script (automatic on first Docker boot, or manually via `npm run seed` in
`backend/`) generates:

- 20 skills (Java, Python, AWS, DevOps, React, Architecture, Security, AI, …)
- 8 teams across Engineering, Data, Operations, Security, Product, and Delivery
- 12 login accounts (Admin, 2x Resource Manager, 1x Team Manager per team, Viewer)
- 50 employees/resources with photos, job titles, skills, locations, and employment %
- 21 projects (19 client projects + 2 internal) spanning Planning/Running/Completed/Cancelled
- 500 allocation records spread across an 18-month window, so allocation history looks
  realistic (only the allocations overlapping "now" count toward current utilization)
- Random vacations and public holidays per resource, including a few deliberately-placed
  overallocated, available, and on-leave people so every dashboard/KPI has something to show

## Local development (without Docker)

**Backend**

```bash
cd backend
npm install
# Point DATABASE_URL in .env at a local Postgres instance
npx prisma migrate dev
npm run seed
npm run start:dev   # http://localhost:4000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev   # http://localhost:3001 (or 3000 if free)
```

The frontend calls the backend at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

## Architecture notes

- **Auth**: mock JWT. `POST /auth/demo-login` issues a token for any seeded user id with no
  password check, used by the persona-picker login screen. `POST /auth/login` does real
  email/password auth (bcrypt) for completeness. Roles (`ADMIN`, `RESOURCE_MANAGER`,
  `TEAM_MANAGER`, `VIEWER`) are enforced both by NestJS guards on the API and by conditional
  UI in the frontend.
- **Allocations model**: an `Allocation` row has `hoursPerWeek` plus a `startDate`/`endDate`
  range, since a resource can have many allocations over time (past, current, future
  engagements). "Current utilization" everywhere in the app (KPIs, resource status, the
  allocation grid) only sums allocations whose date range covers *today*. See
  `backend/src/common/utils/allocation.util.ts`.
- **"AI" assistant** (`POST /ai/ask`): pattern-matches the question (availability, skills,
  overallocation, "can we deliver X", "suggest people for X") and answers from live Prisma
  queries. Genuinely computed from current data, not a canned response, but deterministic and
  offline rather than calling an LLM.
- **Notifications**: computed live from current data (`GET /notifications/live`), covering
  over-allocation, vacation conflicts, projects ending soon, and newly-available people, plus a
  handful of seeded static rows for demo variety.

## API documentation

Full OpenAPI/Swagger UI is served by the backend at **http://localhost:4000/api/docs** once it's
running.

## 5-10 minute demo script

1. **Login** (30s): open the app, show the persona picker (Admin / Resource Manager / Team
   Manager / Viewer), log in as **Administrator**. Call out: mock auth, no SSO needed for a demo.
2. **Dashboard** (2 min): walk the KPI row (employees, available/allocated capacity,
   utilization %, projects running, over/under-allocated counts), then the six charts: capacity
   vs demand by team, utilization distribution, allocation by team/project, the 6-month forecast,
   and the resource heat map. Point out the overallocated/underallocated KPIs are real signals,
   not decoration.
3. **People** (1.5 min): open **People**, filter by skill (e.g. "AWS") and availability, open a
   person's profile, show their skills (1-5 levels), allocation history (spans past/future
   engagements, not just "now"), and vacation/holiday calendar.
4. **Allocation grid** (2 min): open **Allocations**, show the person × project grid with
   live-computed utilization per row. Edit a cell to assign someone to a project and watch
   utilization update immediately. This is the "drag-and-drop-alternative" grid allocation flow
   from the spec.
5. **Projects & Teams** (1 min): open a project to show staffing % against required capacity,
   then open a team to show aggregate utilization and members.
6. **Ask AI** (1.5 min): open **Ask AI**, click through the suggested questions: "Who is
   overallocated?", "Who has AWS skills?", "Can we deliver Project Alpha?", "Suggest people for
   this project". Emphasize these are computed live from the same data just shown, not scripted.
7. **Notifications & roles** (1 min): show live notifications, then log out and log back in as
   **Viewer / Executive** to show read-only access, and as **Team Manager** to show scoped
   permissions (no delete/user-management access).
8. **Swagger** (30s, optional): show `/api/docs` to demonstrate the REST API is fully documented
   for integration.

## AI-assisted development

See [`PROMPTS.md`](./PROMPTS.md) for how this was actually built with Claude: the prompt used
to kick off implementation, the stack and scope decisions deliberately kept for a human call
instead of delegated, and six evidence-backed case studies of AI-generated output that looked
correct and wasn't. Each one covers a dashboard silently reporting 483% utilization, a config
model that changed mid-setup, a framework version that shipped its own warning label, and more,
with the real error text, the root cause, and why the fix targets the class of bug and not
just the instance.

## Deliverables checklist

- [x] Fully functional demo application with realistic sample data
- [x] Source code in this Git repository
- [x] Docker Compose setup for one-command local deployment
- [x] This README with installation and demo instructions
- [x] Seed script to populate the database (`backend/prisma/seed.ts`)
- [x] Executive-grade UI (light/dark mode, responsive)
- [x] REST API documentation (OpenAPI/Swagger at `/api/docs`)
- [x] Demo script above

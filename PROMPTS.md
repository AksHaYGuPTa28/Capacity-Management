# How I Built This With Claude

This document is a record of how I actually worked with Claude to build the Capacity
Management demo, not a sanitized summary. It covers three things: the prompt I wrote to kick
off implementation, the decisions I deliberately kept for myself instead of delegating, and the
six places where Claude's output looked correct and wasn't — with the exact evidence that
proved it and the fix I directed.

The premise I work from: an AI coding agent is a very fast, very capable engineer with zero
context on what "done" means for this specific project until I supply it. My job is to supply
that context precisely enough that the agent's first attempt is close, and then to verify its
output the way I'd review a junior engineer's PR — by reading real output, not by trusting a
green build.

## My workflow, in order

1. **Turn the ambiguous brief into a decision-complete spec before any code gets written.**
   The raw requirements doc I was given left the stack half-open ("React or Next.js," "Spring
   Boot or FastAPI," "SQLite or PostgreSQL") and had no stated build order across 19 sections.
   Handing that straight to an agent produces either an inconsistent stack or a shallow,
   simultaneously-half-built app. I resolved what I could decide myself and explicitly flagged
   the handful of choices that were genuinely mine to make (see *Master prompt* below).
2. **Force a phased build with a stated definition of done**, so there's a checkpoint where I
   can verify a working core before more surface area gets added on top of it.
3. **Name the one bug class most likely to happen, in the prompt itself**, because I know
   where AI-generated CRUD code is statistically weakest: cross-cutting invariants that no
   single file's tests would catch (see the utilization-date-range constraint in the prompt,
   and case study #1 below — I named the risk and it happened anyway, which is exactly why
   naming it wasn't wasted effort: it told me where to look first).
4. **Never accept "it compiles" or "the build passed" as evidence of correctness.** I read
   actual seeded numbers, actual container logs, actual error text. Every case study below was
   caught this way, not by tooling.
5. **When I find a bug, fix the class of bug, not the instance.** Every correction below
   resulted in a shared function or a documented convention, not a one-off patch — because the
   real risk with AI-generated code isn't the mistake you catch, it's the identical mistake
   sitting uncaught in the four files you didn't happen to look at.

## The prompt I gave Claude

```
Build a working demo of a "Capacity Management" web app — the kind a consultant would show a
client to sell the concept of managing team capacity, allocations, and forecasts. It must run
end-to-end with realistic fake data and be demoable in 5–10 minutes. It is explicitly NOT a
production system: no real auth provider, no multi-tenant concerns, no data-retention policy.

OBJECTIVE
Let four kinds of users (Administrator, Resource Manager, Team Manager, Viewer/Executive) see
team capacity, allocate people to projects, forecast utilization, spot over/under-allocation,
and pull management-style dashboards and reports.

STACK — decide, don't leave open
- Frontend: Next.js (App Router) + TypeScript + Tailwind, charts via Recharts.
- Backend: a Node/TypeScript REST API (NestJS) with Prisma ORM — keeps the whole codebase in
  one language, which matters more for a solo/small-team build than matching an "enterprise"
  Java stack.
- Database: PostgreSQL, containerized, with a single Prisma schema as the source of truth.
- Auth: mock JWT only. Ship a persona-picker login (click a seeded user, get a token) as the
  primary demo flow, plus a real email/password form as a fallback — no SSO, no OAuth.
- Packaging: Docker Compose, one command (`docker compose up --build`) brings up
  Postgres + backend + frontend together. The backend container must run migrations and seed
  data automatically on first boot, and must NOT reseed on restart if data already exists —
  a demo presenter's in-session edits (allocations they created live) must survive a restart.

SCOPE — ship a working core first, then layer on
Phase 1 (must work end-to-end before anything else is touched):
  - Auth (persona login + role-gated navigation)
  - Dashboard: 7 KPI tiles (headcount, available/allocated capacity, utilization %, projects
    running, people over/under-allocated) + at least: capacity-vs-demand, utilization
    distribution, allocation-by-team, allocation-by-project, monthly forecast, and a resource
    heat map.
  - CRUD for People (Resources), Teams, Projects, and a Skill catalog with 1–5 proficiency
    levels per person and a "find people with skill X" search.
  - An allocation grid: person × project × hours/week, editable inline, with live utilization
    recompute.
  - Seed script: ~50 employees across ~8 teams, ~20 projects in mixed statuses, ~500
    allocation records, random vacations/holidays, random skills — numbers should look
    plausible on every chart, not just nonzero.
Phase 2 (only after phase 1 is verified working):
  - Calendar/timeline view, skills-based "who's free" forecasting by week/month, notifications
    (over-allocation, vacation conflicts, project ending soon, newly-available people), CSV/
    PDF/Excel export, a natural-language "Ask" feature over the capacity data.

CONSTRAINTS AND DECISIONS TO MAKE EXPLICITLY, NOT BY DEFAULT
- Role-based permissions must be enforced on the API (guards), not just hidden in the UI.
- "Utilization" must always mean *currently active* allocations, not a person's full
  allocation history — if allocations carry date ranges (they should, to make 500 rows of
  seed data look like a real timeline rather than 500 concurrent overbookings), every place
  that sums hours (KPIs, resource status, team/project rollups, the allocation grid, any
  Q&A feature) must filter to "active as of today" consistently. Get this wrong and every
  number on the dashboard is nonsense.
- Any "AI" feature should be genuinely computed from live data (real Prisma/DB queries), even
  if it's implemented as deterministic pattern-matching rather than a call to an LLM — the
  demo must run fully offline, with no API key dependency, and answers must not be canned.
- Where the brief leaves a technical choice open (frontend framework, backend framework,
  database), stop and ask rather than silently picking — these choices are expensive to
  reverse once scaffolding exists.

DELIVERABLES
1. Working app with realistic seed data, verified by actually driving it in a browser
   (login → dashboard → CRUD → allocation grid → AI/notifications), not just "it compiles."
2. Source in a git repo.
3. docker-compose.yml for one-command local deployment.
4. README with install + demo instructions.
5. The seed script itself, committed.
6. UI clean enough to show a customer: light + dark mode, responsive, no placeholder lorem
   ipsum on the main screens.
7. OpenAPI/Swagger for the REST API.
8. A 5–10 minute demo script (what to click, in what order, to tell a coherent story) in the
   README.

DEFINITION OF DONE
`docker compose up --build`, then open the app and complete the full demo script above without
hitting a broken page, a NaN on a chart, or a 500 from the API.
```

## Why I wrote the prompt this way

- **I made the stack decisions explicit instead of leaving them for the model.** The raw brief
  offered "React or Next.js," "Spring Boot or FastAPI," "SQLite or PostgreSQL." I don't hand an
  agent that kind of open fork on a multi-day build — either it produces an inconsistent
  half-and-half stack, or it stops and asks mid-scaffold, which costs more than deciding up
  front would have. I resolved the ones I had a clear opinion on myself and left only the
  genuinely-mine-to-decide ones for the clarifying round below.
- **I stated "phase 1 core, verified working, before phase 2" as a constraint, not a
  suggestion.** A 19-section spec like this invites an agent to build every section shallowly
  in parallel, which is much harder for me to review and much easier for something to be
  silently broken in three places at once. Forcing a checkpoint is how I keep review tractable.
- **I named the utilization/date-range rule explicitly, by describing the exact mechanism.**
  I know this is the single most likely correctness bug in any capacity-planning data model
  before a line of code exists — allocations that carry date ranges but get summed without a
  "which of these are active today" filter. I called it out in the prompt itself, and it
  happened anyway (case study #1 below) — which isn't a failure of the prompt, it's exactly
  why I know to check that specific invariant first on every capacity-planning build I direct
  from now on.
- **I made "verified by driving it in a browser" an explicit deliverable, not an afterthought.**
  Type-checks and a clean build do not catch a KPI computing 483% utilization. If I don't say
  so up front, "done" silently means "compiles," which is a much weaker bar than I actually
  hold the work to.

## Where I stepped in myself, rather than letting the agent decide

Before implementation started, four questions genuinely needed my call rather than a default —
I treat this as the difference between directing an agent and just prompting it once and
hoping:

1. Backend framework — FastAPI vs Spring Boot vs Node/NestJS → **Node/NestJS**, because keeping
   the whole codebase in one language matters more for a demo built and reviewed by one person
   than matching the "enterprise Java" flavor the original brief suggested.
2. Frontend — Next.js vs plain React/Vite → **Next.js**, for the polished, routable UI an
   executive-facing demo needs.
3. Database — PostgreSQL vs SQLite → **PostgreSQL**, both because it matches what the brief
   suggested and because it reads as more credible in a customer-facing demo than a
   single-file database.
4. Build order — everything at once vs phased core-first → **phased**, matching the
   review-checkpoint constraint I'd already put in the prompt.

I answered these myself in under a minute each, because I'd already thought through the
trade-offs while writing the prompt — the questions weren't a surprise, they were the exact
forks I'd flagged as needing a human.

## How I verify AI output: six things that looked right and weren't

I don't trust generated code because it compiles, and I don't trust a working demo because the
happy path renders. Everything below passed its type-checker, its build, and ran without a
console error at the moment it was written. I found every one of these by doing something a
CI pipeline doesn't do on its own: seeding real data, reading the actual numbers, reading actual
container logs, and asking whether what I was looking at made sense.

### 1. The dashboard was lying, with perfect confidence, in six different places at once

**What I saw.** After seeding 500 allocations, I opened the dashboard and the KPIs read:

```
totalEmployees: 50, allocatedCapacity: 9245h, utilizationPct: 483.5%,
peopleOverallocated: 47, peopleUnderallocated: 0
```

Forty-seven of fifty people "overallocated" at nearly 5x capacity. Every chart rendered
without error. The build was clean and the seed script printed `Created 500 allocations.` like
nothing was wrong — this is exactly the kind of confidently-wrong output that's easy to wave
through if you only check that a page loads.

**Why it wasn't obvious from the code.** The data model is correct: an `Allocation` has a
`startDate` and `endDate`, because in a real capacity tool a person is staffed on a project for
a period, not forever. The seed script is correct: it spreads 500 allocations across an
18-month window so the history looks like a real timeline instead of 500 people double-booked
today. The bug was in the six places that read that data back — `resource.allocations` returns
every allocation a person has ever had, and six independent call sites (dashboard KPIs,
per-resource status, team rollups, project staffing %, the allocation grid, the AI Q&A
endpoint) each summed `hoursPerWeek` across the whole list and called it "current load." Read
any one of those six files in isolation and the code looks obviously fine.

**What I directed.** One shared utility, used at every call site instead of six inline sums:

```ts
// backend/src/common/utils/allocation.util.ts
export function isAllocationActiveOn(alloc: DatedAllocation, date: Date): boolean {
  return alloc.startDate <= date && (!alloc.endDate || alloc.endDate >= date);
}
export function currentAllocations<T extends DatedAllocation>(allocations: T[], date = new Date()): T[] {
  return allocations.filter((a) => isAllocationActiveOn(a, date));
}
```

I re-seeded and re-checked the same dashboard after the fix:

```
totalEmployees: 50, allocatedCapacity: 1555h, utilizationPct: 81.3%,
peopleOverallocated: 15, peopleUnderallocated: 18
```

**Why I fixed it this way instead of patching the dashboard endpoint.** The fast fix is a date
filter on the one endpoint I happened to notice first. I didn't take it, because that leaves
the identical bug live in five other files, waiting to surface separately — probably during an
actual customer demo instead of during my own review. I pulled the definition of "current" into
one named, grep-able function so the question "did every caller remember to filter by date"
stops being something I have to re-verify by hand every time someone touches this code.

### 2. The same bug's quieter sibling: the allocation grid silently dropped hours

**What I saw.** After fixing #1, I checked the person × project allocation grid specifically
for someone with two overlapping engagements on the same project — a realistic pattern (a
ramp-down period overlapping the next phase's ramp-up) — and the grid under-reported their
hours.

**What I found.** The grid builds one cell per `(resourceId, projectId)` pair with a plain
object assignment. Two currently-active allocation rows for the same pair meant the second
write silently overwrote the first instead of combining them — the inverse of bug #1:
under-counting within a single moment instead of double-counting across time, because the
aggregation key wasn't guaranteed unique.

**What I directed.**

```ts
const existing = cells[a.resourceId][a.projectId];
cells[a.resourceId][a.projectId] = existing
  ? { id: a.id, hoursPerWeek: existing.hoursPerWeek + a.hoursPerWeek }
  : { id: a.id, hoursPerWeek: a.hoursPerWeek };
```

**Why I checked for this specifically.** Fixing "sum only what's active" doesn't automatically
fix "sum correctly what's active" — those are two different invariants that happen to look
like the same bug from a distance. Once I'd found one aggregation bug, I deliberately went
looking for its inverse in the other place hours get summed by a composite key, rather than
assuming one fix meant the class of bug was closed.

### 3. The ORM's config model had changed out from under the schema mid-setup

**What I saw.** `npx prisma migrate dev` failed immediately on a schema `prisma init` had just
generated:

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: The datasource property `url` is no longer supported in schema files. Move connection
URLs for Migrate to `prisma.config.ts` and pass either `adapter`... See prisma7-client-config
```

**Why it wasn't obvious.** Every NestJS + Prisma pattern I know assumes
`datasource db { url = env("DATABASE_URL") }` works — it has for years, and the tool had just
generated exactly that file itself. It stopped being true in Prisma 7's driver-adapter model,
installed by default with no version pinned.

**What I directed.** Pinned to Prisma 6 (`npm install prisma@6 @prisma/client@6`), removed the
auto-generated `prisma.config.ts`, and kept the classic `provider = "prisma-client-js"`
generator that the rest of the NestJS ecosystem still documents against.

**Why I chose the "old" version over the "current" one.** Prisma 7's redesign is deliberate,
not broken — but adopting it here means debugging a brand-new API surface with thin
documentation, for a dependency whose entire job in this project is to stay invisible. I
optimize for "boring and stable" on infrastructure so I can spend the debugging budget on
the app's actual logic, not on chasing the newest major version of a tool I didn't come here to
learn.

### 4. The framework itself shipped a warning label — and I read it before writing a line of code

**What I saw.** `create-next-app` scaffolded a project whose own `AGENTS.md` read:

```
# This is NOT the Next.js you know
This version has breaking changes... Read the relevant guide in node_modules/next/dist/docs/
before writing any code.
```

Next.js 16 — new enough that I couldn't assume the App Router worked the way I already knew it
to.

**Why this is easy to skip.** Nothing forces you to check. Imports resolve, `page.tsx` and
`layout.tsx` exist where expected, `useRouter` still works. The breaking change is structural:
dynamic route `params` is now a `Promise`, not a plain object, and there's a new
"Cache Components" runtime-caching layer on top of Server Components. Code that looks idiomatic
compiles and runs, and is subtly wrong in ways that surface as stale data or hydration
mismatches much later — exactly the kind of bug that's expensive to trace back to its cause.

**What I directed — a syntax fix and an architectural one.** I read
`node_modules/next/dist/docs/01-app` before writing a page, which led to two decisions:

1. Every dynamic route (`/people/[id]`, `/teams/[id]`, `/projects/[id]`) unwraps `params` with
   React's `use()`:
   ```tsx
   export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
     const { id } = use(params);
   ```
2. I had the whole authenticated app built client-heavy — JWT in a Zustand store, data fetched
   client-side — specifically so it never touches Next 16's new server-caching semantics at
   all. A mock-JWT demo has no request-scoped server session to hang Server Component
   data-fetching off anyway, so fighting the new cache model would have bought nothing. That's
   a decision I made *because* I'd read the docs first, not a workaround I discovered after
   something broke in production.

### 5. A green build and a running container are not the same claim

**What I saw.** `docker compose build` succeeded cleanly for both images. `docker compose up`
started all three containers. The backend then crash-looped:

```
node:internal/modules/cjs/loader:1433
  throw err;
Error: Cannot find module '/app/dist/main'
```

**Why it wasn't obvious.** `nest build` had just succeeded two layers earlier in the same
Dockerfile. It's tempting to trust that a clean compile means the output landed where
convention says it should. It hadn't: `nest-cli.json` sets `sourceRoot: src` without a matching
`rootDir` in `tsconfig.json`, so `tsc` preserves the `src/` folder inside `dist/` — the real
entry point is `dist/src/main.js`, not `dist/main.js`. The entrypoint script assumed the wrong
one.

**What I directed.** Fixed the entrypoint (`exec node dist/src/main`) and `package.json`'s
`start:prod`, then rebuilt and — critically — read the container logs to confirm the process
actually stayed up, instead of stopping at "the image built."

**Why I don't stop at a successful build.** A build succeeding is a claim about syntax. A
container staying up is a claim about runtime behavior, and Docker multi-stage builds make it
easy to conflate the two — a wrong path in a shell script produces zero build-time errors. For
something delivered as "run one command," that gap is exactly where a demo fails on someone
else's machine after I've already called it done. I always run the actual container and read
its logs before I consider a Docker deliverable finished.

### 6. Not a bug I found — a failure mode I designed out in advance

This one isn't a correction, it's the other half of verification discipline: anticipating
where randomness could make a live demo fail *without any bug being present*. 500 allocations
with randomized dates and hours across an 18-month window produce a plausible utilization
spread most of the time — but "most of the time" isn't a bar I'll present live on. I had the
seed script reserve a handful of resources and force them into specific states regardless of
what the random pass produced: some pinned visibly overallocated right now, some pinned with
zero current allocations, one pinned onto an active vacation. That guarantees every KPI tile,
every chart bucket, and every "Who is overallocated?" / "Who is available?" AI answer has
something real to show on every single seed run — not usually, always. It's the same
discipline as the bugs above, aimed forward instead of backward: I don't just verify the data
model is correct, I remove the one variable — randomness — that could make a correct system
still fail to demo well.

## What this adds up to

I don't measure success on a project like this by "did Claude produce working code." It almost
always does, for the parts that are locally reviewable. I measure it by whether I gave the
agent a specification precise enough to start close to right, and whether I personally verified
the parts that only fail in ways a compiler can't see — cross-file invariants, runtime behavior
inside a container, dependency version drift, and the gap between "the happy path works" and
"this survives someone else running it." That verification pass — not the prompt — is where six
real defects got caught before anyone but me ever saw them.

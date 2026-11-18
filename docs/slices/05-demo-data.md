# Slice 05: Demo data and a read-only list

- Status: planned
- Journeys: J1
- Depends on: ADR-002, ADR-003, D-052 (all merged); slice 04 domain core (merged)
- Branch / PR: `slice-05-demo-data` / filled in when opened

## Goal

After this slice a demo visitor can press "Load demo data" and then see their own copy of synthetic transactions in a table that is paginated (80 rows per page, numbered pages) and sortable by date and amount. Another visitor never sees that copy. The database now has its first tables.

## Size warning and proposed split

This is bigger than the other slices so far: the first migration, a demo data generator, the data functions, the cookie, a server action and the table UI. Under the rules I should not widen it silently, so I propose two pull requests:

- **05a, data layer, no UI:** migration tool and first migration, the lists-match test, the demo data generator, the data functions with the database tests (including "visitor A cannot see visitor B's rows").
- **05b, the screens:** cookie, "Load demo data" action, `/transactions` with the table, the empty and error states, the demo banner.

05b depends on 05a being merged. If you prefer one pull request, the plan below is the whole thing.

## Scenarios covered

From J1 in the SPEC:

- "Empty app offers a way in": covered for demo mode (the "Load demo data" button; the sample files arrive in slice 15). No charts are shown.
- "Demo user loads demo data": a copy is stored for my visitor session only, and the demo banner is visible. The SPEC says I land on Insights; Insights does not exist yet, so I land on Transactions (open question 3).
- "Returning visitor whose copy has expired": I see the empty state again, not an error (read rule only; the cleanup job is slice 15).
- "Database unreachable on first visit": I see the error state with a retry action, not the empty state.

Edge cases from J1:

- Load pressed twice quickly, or in two tabs with the same cookie: one copy, no duplicate rows.
- Cleared or blocked cookies: a new, empty copy each time (follows from the cookie design).

Table behaviour from D-052: 80 rows per page, numbered page navigation, sort by date and amount, no filtering.

Not covered: the expiry cleanup job and Reset (slice 15), sample file picker (slice 15), Insights (slice 12), editing (slice 10), the "View context" dialog (slice 11).

## In scope

**05a: data layer**

- **Migrations.** Plain numbered SQL files in `db/migrations/` and a small runner (`npm run db:migrate`) that applies the files not yet recorded in a `schema_migrations` table, each in one transaction. First migration: `visitor`, `import`, `transaction`, `context`, the constraints and indexes from ADR-003. See open question 1.
- **Lists match the database.** A Vitest test reads the migration SQL and checks that its CHECK lists equal `CATEGORIES`, `MOODS`, `MOTIVATIONS`, `OUTCOMES` and the source types in the code.
- **Dates from the driver.** Queries select `date::text`, so the app always gets the `YYYY-MM-DD` string that `DateSchema` expects, whatever the driver does with `date`. A database test confirms it.
- **Demo data generator.** A pure function `generateDemoTransactions({ seed, count, endDate })` in `src/domain/` that returns rows (everything in `Transaction` except `id`, `visitorId`, `importId`, `createdAt`). It uses a seeded random generator so the same seed gives the same rows. It makes believable UK spending: monthly salary and rent, groceries, eating out, transport, subscriptions, a few refunds and transfers; roughly one row in five has a complete context; `original` equals the current values; `merchantKey` comes from the existing `merchantKey()`; a running balance runs through the rows; `categorySource` is `ai`. All text is invented.
- **Data functions** in `src/data/` (server-only, plain SQL through `getSql()`, every one takes `visitorId`, every query filters on it, every row read is parsed with Zod):
  - `createDemoCopy(visitorId, rows)`: in one transaction, takes an advisory lock for the visitor, creates the `visitor` row if needed, and inserts the `import` and all transactions only if the visitor has no import yet (so a double press creates one copy).
  - `listTransactions(visitorId)`: all of the visitor's rows with their context, newest first, as `TransactionRow` view models.
  - `getVisitor(visitorId)`: the visitor row, or nothing.
  - `deleteVisitor(visitorId)`: used by tests now and by Reset later.
- **View model.** A pure `toTableRow` that turns a stored transaction into what the table shows: id, date, description, category, context tags (mood, motivation, outcome or none), amount in pence, and the `edited` flag from `edited()` in `src/domain/derived.ts`. The browser gets this smaller shape, not the full transaction.
- **Expiry rule.** A pure `isExpired(lastSeenAt, now, windowMs)` using the 24-hour window, which lives in `src/config/demo.ts`. `getVisitor` treats an expired visitor as missing.
- **Database tests** (`npm run test:db`, see open question 4) against the Neon `dev` branch, each using a fresh random visitor id and deleting it afterwards.

**05b: the screens**

- **Cookie.** `moneo_visitor` holds a random UUID; it is httpOnly, `sameSite: "lax"`, `secure` in production, path `/`, and lasts 30 days. Whether a copy is still valid is decided by the database (24 hours), not by the cookie. A cookie value that is not a UUID is treated as no cookie (Zod).
- **"Load demo data" server action.** Demo mode only: it checks `getAppMode()` and refuses otherwise, so the demo path is not reachable in user mode. It reads or creates the cookie (cookies can only be set in a server action or route handler, per the Next.js docs), generates the rows, calls `createDemoCopy`, and redirects to `/transactions`. The button is disabled while the action runs.
- **Routes.**
  - `/` redirects to `/transactions` when the visitor has a copy, otherwise to `/import`.
  - `/import` shows the empty state: heading, text, and "Load demo data" (demo mode).
  - `/transactions` shows the table, or the empty state when there is no copy.
  - Reading the cookie happens under `<Suspense>` with a loading skeleton, because Cache Components is on (`next.config.ts`).
  - An `error.tsx` shows "Can't reach your data" with "Try again", as in the mockup, and never the empty state.
- **The table.** `@tanstack/react-table` with the shadcn `table` component, as a client component:
  - columns Date, Description, Category, Context (tags only), Amount; amounts through `formatPence`;
  - client-side sorting on Date and Amount (click the header, `aria-sort` set), default newest first;
  - client-side pagination, 80 per page, page buttons with numbers and an ellipsis for long ranges (for example 1 … 4 5 6 … 38), plus previous and next; changing the sort goes back to page 1; the current page is marked with `aria-current`;
  - a pure `pageNumbers(current, total)` helper decides which buttons appear;
  - the row rendering is its own component, separate from the data and column definitions, so TanStack Virtual can be added later without touching the rest (D-052).
- **Demo banner.** "Demo data only." in the layout when `getAppMode()` is `demo`.
- **Header.** Two links, Transactions and Import. Insights arrives with slice 12.
- **Config.** `src/config/demo.ts`: demo row count (3,000 by default, see open question 2), visitor expiry window, cookie name. An optional `DEMO_ROW_COUNT` environment variable, parsed with Zod and capped at `maxRows`, lets me check 5,000 rows locally. Added to `.env.example` and the README.
- **README.** Short sections on migrations (how to run them on `dev` and `main`), the visitor cookie, and `test:db`.

## Out of scope

- Expiry cleanup job and Reset (slice 15), and refreshing `last_seen_at` on activity (slice 15, with the cleanup, so a copy currently expires 24 hours after it is created).
- Sample file picker, "Import a statement", CSV parsing (slices 06, 15).
- Insights and charts, filters and search, editing, undo, the context dialog and context entry.
- AI categorisation, usage counters, the AI-derived data table.
- Auth, row-level security, user mode screens.
- Putting the page number in the URL.

## Files likely to change

- `db/migrations/0001_initial.sql` (new), `scripts/migrate.ts` (new), `package.json` (scripts `db:migrate`, `test:db`; add `@tanstack/react-table`)
- `src/config/demo.ts` (new), `src/lib/env.ts` and its test (optional `DEMO_ROW_COUNT`)
- `src/domain/demoData.ts` and test, `src/domain/tableRow.ts` and test, `src/domain/visitor.ts` and test (cookie value, `isExpired`), `src/domain/pagination.ts` and test
- `src/data/*.ts` and `src/data/*.db.test.ts` (new), `vitest.config.mts` (keeps `*.db.test.ts` out of `test:run`; a second config for `test:db`)
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/import/page.tsx`, `src/app/transactions/page.tsx`, `src/app/transactions/error.tsx`, `src/app/actions/loadDemoData.ts`
- `src/components/transactions/*` (table, row, pagination), `src/components/ui/table.tsx` (shadcn)
- `.env.example`, `README.md`, `docs/slices/README.md`, `docs/slices/05-demo-data.md`
- Possibly `docs/ADR/ADR-002.md` (record the answers to its open decisions 1 and 2)

Before writing any code I will read the relevant guides in `node_modules/next/dist/docs/` (cookies, mutating data, error handling, caching with Cache Components), because this Next.js version differs from what I know.

## How it will be tested

- **Vitest unit tests for:**
  - `generateDemoTransactions`: same seed gives the same rows; the requested count; every row passes `TransactionSchema` once ids are added; all amounts are integer pence; categories and context values are in the fixed lists; income is never negative; contexts are complete; about one in five rows has a context; running balances follow the amounts; dates stay in range.
  - `toTableRow` (context tags, edited flag), `pageNumbers` (first page, middle, last, few pages, one page), the visitor cookie value parser, `isExpired`, the optional `DEMO_ROW_COUNT` parser.
  - The lists-match test against the migration SQL.
- **Database tests (`npm run test:db`, against the `dev` branch):**
  - the migration applies on a fresh schema and is not applied twice;
  - `createDemoCopy` stores the rows and `listTransactions` returns the same count;
  - **visitor A cannot read or change visitor B's rows** (the leak test);
  - two simultaneous `createDemoCopy` calls for one visitor create one copy;
  - `deleteVisitor` removes imports, transactions and contexts (the cascade);
  - `date` comes back as `YYYY-MM-DD`;
  - an expired visitor is treated as missing.
- **Manual check (05b), in a real browser with `npm run dev`:**
  - First visit shows the empty state; "Load demo data" lands on Transactions with the banner; a second browser profile gets its own empty app, then its own copy.
  - Pressing the button twice quickly leaves one copy.
  - Pages, numbered buttons, and sorting by date and amount work; sort change returns to page 1.
  - With `DEMO_ROW_COUNT=5000`: page changes and sorting stay quick, and I note the page payload size and the timings in the pull request.
  - Database unreachable (wrong `DATABASE_URL`): the error state with "Try again", not the empty state.
  - Console and terminal show no errors.
  - After merge, the same on the Vercel deployment.
- **Not tested:** behaviour under many simultaneous visitors, and the cleanup job (not built yet).

## Open questions

1. **Migrations tool.** Plain SQL files and a small runner (my recommendation: you see exactly what runs, no new library, same SQL you will write anyway), or a tool such as Drizzle Kit or node-pg-migrate. Also: how does `main` get migrated? My proposal is to run `npm run db:migrate` against the `main` connection string by hand just before merging a pull request that adds a migration, and to write that down in the README. Automating it can come later. If you agree I will also record the answers to ADR-002 open decisions 1 (raw SQL first) and 2 (migrations) in ADR-002.
2. **How many rows does a demo copy have, and does storage matter?** I suggest 3,000 rows, about a year of an active account, which stays inside the "3 to 5 thousand" constraint and keeps copies smaller than the 5,000 maximum. Each copy takes storage on the Neon Free plan, and copies are only removed by the slice 15 cleanup job. I will measure the real size of one copy with `pg_total_relation_size` and put it in the pull request, so you can judge. If the number worries you, we pull a minimal cleanup forward.
3. **Where does "Load demo data" land?** The SPEC says Insights, which does not exist. I propose Transactions for now and changing it when Insights is built. OK?
4. **Database tests.** They need a real database, so they are a separate command (`npm run test:db`) run by hand against the `dev` branch, not by CI (CI has no database secret). The leak test and the cascade test live there. Agree, or do you want them in CI with a separate Neon branch?
5. **Split.** One pull request, or 05a and 05b as proposed above?

## Decisions made during the slice

Record anything decided while building, with a pointer to SPEC-DECISIONS.md or an ADR.

-

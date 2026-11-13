# Slice 02b: Database switch to Postgres on Neon

- Status: in review
- Journeys: none (foundation)
- Depends on: ADR-002 (merged), slice 02 (merged)
- Branch / PR: `slice-02b-postgres`

## Goal

After this slice the app talks to a Postgres database on Neon instead of Neo4j, and the health check tells you whether that connection works, both locally and on the Vercel deployment. No app data is stored yet. Neo4j is gone from the code.

## Scenarios covered

None. This slice has no user behaviour from the SPEC.

## In scope

- The author creates the Neon project, with a `main` branch for the deployed app and a `dev` branch for local work (ADR-002), and puts the connection strings in `.env.local` (dev branch) and on Vercel (Production uses the main branch; Preview uses the dev branch, so previews never write into the deployed data). I give a short step list after the plan is approved.
- Remove `neo4j-driver` and `src/lib/neo4j.ts`. Add a Postgres driver (see open question 1) and a server-only module `src/lib/db.ts` that:
  - starts with `import "server-only"`;
  - reads `DATABASE_URL` through the Zod env schema and fails with a message naming the variable (never its value);
  - creates one client and reuses it (kept on `globalThis` in development, as the Neo4j driver was).
- `src/lib/env.ts`: replace the three Neo4j variables with `DATABASE_URL`, validated as a non-empty string starting with `postgres://` or `postgresql://`. Rename `parseNeo4jEnv` to `parseDatabaseEnv`; update `src/lib/env.test.ts` (same cases: valid, missing, empty, wrong prefix, no value in the error message).
- `src/app/api/health/route.ts`: run `SELECT 1` through `src/lib/db.ts`. Same answers as before: `200 {"status":"ok"}` or `503 {"status":"error"}`, no details in the response, real error in the server log.
- `eslint.config.mjs`: the restricted import becomes the chosen driver package, allowed only in `src/lib/db.ts`.
- `.env.example`: `DATABASE_URL=` replaces the three Neo4j names.
- `README.md`: rewrite the Database section for Neon (what it is, set up, branches, health check, idle behaviour), the environment variable sentence and the lint line.
- `docs/slices/README.md`: slice 02b status; `docs/slices/02-database.md` stays as history.
- After merge, the author deletes the AuraDB instance and removes the `NEO4J_*` variables from Vercel.

## Out of scope

- Any tables, schema, migrations or queries beyond `SELECT 1`. The data model is ADR-003.
- The query layer choice (raw SQL or Drizzle) and the migrations tool (ADR-002 open decisions 1 and 2).
- Row-level security (ADR-002 open decision 3).
- A scheduled ping to keep the database awake.
- Auth, the mode flag, limits, the LangGraph checkpoint store.
- Any UI.

## Files likely to change

- `package.json`, `package-lock.json` (remove `neo4j-driver`, add the driver)
- `src/lib/neo4j.ts` (deleted), `src/lib/db.ts` (new)
- `src/lib/env.ts`, `src/lib/env.test.ts`
- `src/app/api/health/route.ts`
- `eslint.config.mjs`
- `next.config.ts` (only if the build needs `serverExternalPackages` for the driver)
- `.env.example`
- `README.md`
- `docs/slices/README.md`, `docs/slices/02b-postgres.md`

## How it will be tested

- Vitest unit tests for: `parseDatabaseEnv` (valid URL with either prefix; missing; empty; wrong prefix; the value never appears in the error message). `db.ts` is a thin wrapper around the driver and is not unit tested.
- Manual check:
  - `npm run check` and `npm run build` pass.
  - Locally, with `.env.local` filled in: `curl localhost:3000/api/health` returns `200 {"status":"ok"}`.
  - With a wrong password in the URL: `503 {"status":"error"}`, the password and URL do not appear in the response, and the terminal shows the real error.
  - With the variable removed: same 503, and the log names `DATABASE_URL`.
  - Import `src/lib/db.ts` from a throwaway Client Component and check the build fails, then remove it.
  - After the Neon database has been idle for a while: the first health check still answers 200 (it may be slow), see open question 3.
  - On the Vercel preview and on production after merge: `/api/health` returns 200.
  - Start the app with `npm run dev`, open it in a browser, check it renders with no console or terminal errors, and say what I looked at in the PR description.
- What I will not test: behaviour under load or reconnection after a failure.

## Open questions

All answered by the author before approval:

1. **Driver:** `@neondatabase/serverless`.
2. **Free-plan limits:** checked by the author, no conflict.
3. **Idle wake-up:** connection timeout of about 10 seconds and a README note, nothing more.
4. **Health check access:** stays public, ok or error only.
5. **Region:** closest to the Vercel function region.

## Decisions made during the slice

Record anything decided while building, with a pointer to SPEC-DECISIONS.md or an ADR.

- Neon connection strings are set by hand in `.env.local` and on Vercel, not through the Vercel integration, so no branches are created automatically.
- Preview deployments use the `dev` branch, so previews never write into the deployed data.
- The Neon HTTP client has no pool, so `getSql()` returns a fresh client per call instead of reusing one on `globalThis`. This also gives each call its own 10-second timeout.

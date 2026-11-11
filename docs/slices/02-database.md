# Slice 02: Database

- Status: merged
- Journeys: none (foundation)
- Depends on: slice 01 (merged), ADR-001 (Neo4j AuraDB)
- Branch / PR: `slice-02-database` / PR #3

## Goal

After this slice the app can talk to a Neo4j AuraDB instance from the server, and a health check tells you whether the connection works, both locally and on the Vercel deployment. No app data is stored yet.

## Scenarios covered

None. This slice has no user behaviour from the SPEC.

## In scope

- Create a free AuraDB instance (done by the author in the Aura console, with a short step list from me) and put its connection details in `.env.local` and in Vercel (Production and Preview).
- Add the official `neo4j-driver` package.
- A server-only module `src/lib/neo4j.ts` that:
  - starts with `import "server-only"`, so importing it from a Client Component fails the build;
  - reads `NEO4J_URI`, `NEO4J_USERNAME` and `NEO4J_PASSWORD`, and fails with a clear message naming the missing variable;
  - creates one driver and reuses it (kept on `globalThis` in development so hot reload does not open a new connection pool on every edit).
- A health check route `GET /api/health` that runs `RETURN 1` against the database and answers:
  - `200 { "status": "ok" }` when it works;
  - `503 { "status": "error" }` when it does not, with no error details in the response (the real error goes to the server log).
  - Never cached (route handlers are not cached by default in this Next.js version; I will confirm in the build output).
- Confirm that `NEO4J_*` have no `NEXT_PUBLIC_` prefix, so they never reach the browser.
- README: a short "Database" section (how to create the Aura instance, where the variables go, how to call the health check).

## Out of scope

- Any nodes, relationships, constraints or indexes. The data model is a separate ADR, needed before slice 05 (ADR-001 open decision 1).
- The visitor filter on queries (slice 05). This slice has no demo data, so nothing can leak yet. The client module will not offer a "run any query" helper that skips scoping once data exists; that is decided in slice 05.
- Vitest, CI and Zod (slice 03).
- Auth, the mode flag, usage limits, the LangGraph checkpoint store (open decisions 2, 16, 9).
- Any UI. The health check is an API route only.

## Files likely to change

- `package.json`, `package-lock.json` (add `neo4j-driver`, and `server-only` if lint asks for it)
- `src/lib/neo4j.ts` (new)
- `src/app/api/health/route.ts` (new)
- `next.config.ts` (only if the build needs `serverExternalPackages` for the driver)
- `.env.example` (comments only, if needed)
- `README.md`
- `docs/slices/README.md` (slice 01 to merged, slice 02 status)
- `docs/slices/01-deploy.md` (status to merged)

## How it will be tested

- Vitest unit tests for: none. Vitest arrives in slice 03, and this slice has no pure logic to test; it is a thin wrapper around the driver.
- Manual check:
  - `npm run build` and `npm run lint` pass.
  - Locally, with `.env.local` filled in: `curl localhost:3000/api/health` returns `200 {"status":"ok"}`.
  - With a wrong password in `.env.local`: it returns `503 {"status":"error"}`, the password and URI do not appear in the response, and the terminal shows the real error.
  - With a variable removed: same 503, and the log names the missing variable.
  - Import `src/lib/neo4j.ts` from a throwaway Client Component and check the build fails, then remove it.
  - On the Vercel preview for the pull request and on production after merge: `/api/health` returns 200.
  - Open the app in a browser with `npm run dev` and check the page still renders with no console or terminal errors.
- What I will not test: behaviour when Aura is paused (see open question 2), load or reconnection under failure.

## Open questions

1. **Zod now or in slice 03?** The rules say Zod at every boundary, but Zod is installed in slice 03. For this slice I would check the three variables by hand (non-empty strings) and switch to a Zod env schema in slice 03. Or install Zod now just for that? I would wait, to keep this slice small. OK?
2. **Free tier pausing:** AuraDB Free pauses after a few days without activity and deletes the instance if it stays paused for a long time. A recruiter opening the demo after a quiet week may hit a paused database. For now I would accept that and only note it in the README. A scheduled ping (Vercel cron calling `/api/health`) could keep it awake; that can be a later small piece of work. Agree?
3. **Health check access:** it is public and returns only ok/error, no details. Fine, or do you want it hidden (for example behind a secret header)?
4. **Region:** which region for the Aura instance? I would pick one in the UK or EU, closest to the Vercel function region. The data is synthetic only, so this is about latency, not compliance.
5. **Instance creation:** you need to log in to Aura and create the instance, then download the credentials file once (the password is shown only at creation). I cannot do this for you. I will give the steps once the plan is approved.

## Decisions made during the slice

- Local development and the deployed app share the one AuraDB Free instance. Neo4j allows one free instance per account, so a second one for dev would need a paid tier. This is fine while the database is empty. Before slice 05 (which writes data), decide whether to run Neo4j locally in Docker for dev (`bolt://localhost:7687`) or keep sharing. Recorded as a gate in `docs/slices/README.md`.
- The Zod env schema waits for slice 03; the three variables are checked by hand in `src/lib/neo4j.ts`.
- Aura pausing is accepted for now. A daily cron ping to `/api/health` can be added before the demo link is shared.

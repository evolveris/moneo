# Slice plan

How the app is built, one slice at a time. The rules are in `AGENTS.md` at the repo root. Each slice is a thin vertical piece, one pull request, merged by the author before the next one is planned.

A slice's detailed plan (`NN-name.md`, from `_template.md`) is written only when that slice is next, so plans never go stale.

## Status

| Slice | Name | Journeys | Status |
|---|---|---|---|
| 00 | App: Next.js, strict TypeScript, Tailwind, shadcn, layout | - | merged |
| 01 | Deploy: Vercel, preview per pull request, environment variables documented | - | merged |
| 02 | Database: Neo4j AuraDB connection, server-only client, health check | - | merged |
| 03 | Tooling: Vitest, lint and format, CI check, Zod installed | - | merged |
| 03a | Design: review the draft mockups, decide the lists and fields the domain core needs | J2, J5 to J8 | merged |
| 04 | Domain core, no UI: money in pence, Zod schemas, category and context lists, mode flag, `getLimits` | shared rules | merged |
| 02b | Database: switch from Neo4j to Postgres on Neon (ADR-002) | - | merged |
| 05 | Demo data and a read-only list: visitor cookie, per-visitor copy, virtualised table of 5,000 rows | J1 | planned |
| 06 | CSV import, happy path: parser with RBS preset, basic review, save | J2 | planned |
| 07 | Review by exception: duplicates, needs-fix, summary, balance check | J2, J5 | planned |
| | **Milestone 1: demo-ready** | | |
| 08 | AI categorisation: `extract` interface (live and replay), "unknown" | J6 | planned |
| 09 | Category overrides, same-merchant batch, undo | J6 | planned |
| 10 | Inline editing of date, amount and description | J12 | planned |
| 11 | Context entry | J7 | planned |
| 12 | Charts: category, 12-month trend, behaviour | J8 | planned |
| 13 | PDF import | J3 | planned |
| 14 | Receipt import | J4 | planned |
| 15 | Demo mode: start button, sample picker, bad files, limits, reset, expiry | J9, J10 | planned |

J11 (two of us) waits for auth and is not sliced yet.

## Gates before certain slices

These are decisions or spikes the slice depends on. Do them first, as small separate pieces of work.

- **Before slice 05:** ~~the Postgres switch (slice 02b) and the data model ADR~~ done: ADR-002 and ADR-003. Slices 05 to 07 write transactions to the database; the tables are in ADR-003.
- **Before slice 05:** table spike (ADR-001 open decision 18): 5,000 rows, one editable column, Zod on commit, keyboard navigation.
- **Before slice 05:** ~~decide the dev database~~ answered by ADR-002: Neon branches, `dev` for local and `main` for deployed.
- **Before slice 06:** a decision on how the CSV parser learns the layout (ADR-001 open decision 12). Presets only is enough to start.
- **Before slice 08:** LangGraph.js spike (ADR-001 open decisions 9 and 14), and the decision on the multimodal model (open decision 10) before slices 13 and 14.
- **Before slice 15:** the mode flag mechanism (ADR-001 open decision 16). An environment variable is enough to start.

## Milestone 1: demo-ready

After slice 07 the deployed demo can load demo data, import a sample CSV, show it in a table and handle bad files at review. It has no categories or charts yet.

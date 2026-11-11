# Moneo

The why behind the buy. A personal finance web app (UK, GBP only) that shows where money goes and why.

Project rules for contributors and AI agents are in `AGENTS.md`. The slice plan is in `docs/slices/README.md`.

## Run locally

Needs Node 22 and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run build
npx tsc --noEmit
npm run lint
```

Run `npm run build` first: Next.js generates some types (like `LayoutProps`) during the build.

## Deploy

The app is hosted on Vercel at https://moneo-neon.vercel.app/.

- Merging a pull request into `main` deploys to production.
- Every pull request gets its own preview deployment. Vercel posts the link on the pull request.
- If a build fails, the previous production version stays up.

## Environment variables

The names the app needs are in `.env.example`. Today these are the three Neo4j ones (see Database below).

- Locally: copy `.env.example` to `.env.local` and fill in the values. `.env.local` is ignored by git.
- On Vercel: add the same names under Project, Settings, Environment Variables.

Never commit real values. Only synthetic sample data goes on the deployed app.

## Database

Moneo stores its data in Neo4j, hosted on AuraDB Free (https://console.neo4j.io).

- **Aura** is Neo4j run for us in the cloud. **`neo4j-driver`** is the library in our server code that talks to it over the Bolt protocol (TLS, `neo4j+s://`). `src/lib/neo4j.ts` creates one driver, which is a connection pool, and reuses it. It is server-only: importing it from a Client Component fails the build.
- **Set up:** create an AuraDB Free instance, download the credentials once (the password is shown only at creation), and put `NEO4J_URI`, `NEO4J_USERNAME` and `NEO4J_PASSWORD` in `.env.local` and on Vercel (Production and Preview). Never prefix them with `NEXT_PUBLIC_`.
- **Health check:** `GET /api/health` runs `RETURN 1`. It answers `200 {"status":"ok"}` or `503 {"status":"error"}`. The reason for a failure is in the server log, not in the response.
- **Paused instance:** AuraDB Free pauses after a few days without queries. If the health check returns 503 and the log shows a connection error, open the Aura console and resume the instance.

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

The names the app needs are in `.env.example`. There are none in use yet (the Neo4j ones arrive in slice 02).

- Locally: copy `.env.example` to `.env.local` and fill in the values. `.env.local` is ignored by git.
- On Vercel: add the same names under Project, Settings, Environment Variables.

Never commit real values. Only synthetic sample data goes on the deployed app.

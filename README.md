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

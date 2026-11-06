# Moneo

The why behind the buy. A personal finance web app (UK, GBP only) that shows where money goes and why.

Project rules for contributors and AI agents are in `AGENTS.md`. The slice plan is in `docs/slices/README.md`.

## Run locally

Needs Node 22 and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Checks

```bash
pnpm build
pnpm exec tsc --noEmit
pnpm lint
```

Run `pnpm build` first: Next.js generates some types (like `LayoutProps`) during the build.

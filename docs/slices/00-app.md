# Slice 00: App

- Status: in review
- Journeys: none (foundation)
- Depends on: ADR-001 (stack)
- Branch / PR: `slice-00-app` / PR link in the pull request

## Goal

After this slice the developer can run `npm run dev` and see an empty Moneo app shell in the browser: Next.js with strict TypeScript, Tailwind CSS, shadcn/ui set up, and a basic layout (header, main area) that later slices fill in.

## Scenarios covered

None. This slice has no user behaviour from the SPEC. It only creates the base the other slices build on.

## In scope

- Next.js (App Router) project created in the repo root, with `npm`.
- TypeScript in strict mode (`"strict": true`, plus `noUncheckedIndexedAccess`).
- Tailwind CSS.
- shadcn/ui initialised, with one component added (`Button`) to prove the setup works.
- Root layout: header with the app name "Moneo" and the tagline, a main content area, and a placeholder home page.
- Page metadata (title, description).
- SUSE Mono (Google Fonts, via `next/font`) for headings, the logo and, later, numbers and amounts (`font-mono`). Body text stays on Geist until the author picks one.
- `README.md` with how to install and run.
- `.gitignore` check (already has `.env*`, `node_modules/`, `.next/`).

## Out of scope

- Deploy to Vercel (slice 01).
- Neo4j (slice 02).
- Vitest, lint and format rules beyond the Next.js defaults, CI, Zod (slice 03).
- Any domain code, navigation links, auth, dark mode toggle, or real pages.
- Environment variables.

## Files likely to change

- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`
- `postcss.config.mjs`, `components.json`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/components/ui/button.tsx`, `src/lib/utils.ts`
- `README.md`

## How it will be tested

- Vitest unit tests for: nothing. There is no business logic yet, and Vitest arrives in slice 03.
- Manual check: `npm install`, `npm run dev`, open `http://localhost:3000`, see the header and home page. `npm run build` and `npx tsc --noEmit` pass with no errors.

## Open questions

Defaults I will use unless you say otherwise:

1. Package manager: `npm` (switched from pnpm at the author's request).
2. Source folder: use `src/` (so code is in `src/app`).
3. Scaffold command: `create-next-app` into the existing repo root, keeping `docs/`, `AGENTS.md` and `CLAUDE.md`.
4. shadcn style: default style, neutral base colour.
5. Slice is small, so no split and no grilling needed unless you want to change a default.

## Decisions made during the slice

- Package manager switched from pnpm to npm after review.
- Scaffolded in a temp folder and copied in, because `create-next-app` refuses a folder that has `AGENTS.md` and `CLAUDE.md`.
- Added `noUncheckedIndexedAccess` on top of `strict`.
- Added SUSE Mono at the author's request, to the same PR. Body font is still Geist (placeholder).
- shadcn style is the CLI default (`base-nova`), neutral base colour.

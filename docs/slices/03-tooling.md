# Slice 03: Tooling

- Status: in review
- Journeys: none (foundation)
- Depends on: slice 02 (merged)
- Branch / PR: `slice-03-tooling` / see the pull request

## Goal

After this slice every pull request is checked automatically (types, lint, formatting, tests, build), tests can be written and run with one command, and Zod is installed and used for its first real job: validating the Neo4j environment variables. The checks that are now only my manual habit become a gate you can see on GitHub.

## Scenarios covered

None. This slice has no user behaviour from the SPEC.

## Your questions

### Do we have hot reload?

Yes, already. `npm run dev` runs Next.js with Turbopack and Fast Refresh: when you save a component, the browser updates without a full reload and keeps React state. Things to know:

- Changes to `.env.local` and `next.config.ts` need a restart of `npm run dev`.
- Edits to server code (route handlers, `src/lib`) are picked up on the next request.
- Module-level state survives some reloads, which is why the Neo4j driver is kept on `globalThis` (slice 02).
- Vitest has its own watch mode: `npm test` re-runs the affected tests when you save a file. It runs in a second terminal next to `npm run dev`.

Nothing to build for this; the slice only documents it in the README.

### How are we going to do linting?

What exists today: ESLint 9 with the flat config `eslint.config.mjs`, using `eslint-config-next` (`core-web-vitals` and `typescript`). That is about 86 rules: React and React Hooks (including the new React Compiler rules), accessibility (`jsx-a11y`), Next.js rules, and the basic `typescript-eslint` recommended set. Two facts that matter:

- **`next build` no longer lints** (Next.js 16 removed `next lint`). So nothing today stops a lint error reaching `main` or Vercel. A CI job fixes that.
- The current TypeScript rules are not type-aware: they cannot see that a promise is never awaited, which is a real risk in the database and AI code to come.

Plan: keep ESLint (it is what `eslint-config-next` supports), keep the Next config as the base, and add a small layer of extra rules on top (next section). Prettier handles formatting, ESLint handles bugs, and they do not overlap (`eslint-config-prettier` turns off any ESLint rule that would fight Prettier).

### What are the best rules for React, TypeScript and JavaScript?

There is no single "best" set. A good rule of thumb: start from the recommended sets, add the few rules that catch bugs this project is likely to have, and avoid style rules that Prettier already settles. Proposed:

**Already on (from `eslint-config-next`), kept as they are**
- React: `jsx-key`, no deprecated APIs, no unescaped entities, and so on.
- React Hooks: `rules-of-hooks`, `exhaustive-deps`, and the React Compiler rules (`purity`, `refs`, `set-state-in-effect`, ...).
- Accessibility: `jsx-a11y` basics (alt text, valid ARIA).
- TypeScript: `no-explicit-any`, `no-unused-vars`, `ban-ts-comment`.
- JavaScript: `no-var`, `prefer-const`.

**Added in this slice**
- **Type-aware TypeScript** (`typescript-eslint` `recommendedTypeChecked`, using the project's `tsconfig`). The ones that matter most here:
  - `no-floating-promises`: an un-awaited database or AI call is an error.
  - `no-misused-promises`: no async function where a sync callback is expected (for example in event handlers).
  - `await-thenable`, `no-unsafe-*` (stops `any` leaking in from untyped sources, which suits "Zod at every boundary").
  - Slower than non-type-aware linting (a second or two on this size of project). Worth it.
- `@typescript-eslint/consistent-type-imports`: `import type` for types, keeps client bundles clean.
- `eqeqeq` (always `===`), `no-console` set to warn with `error` and `warn` allowed (the health check logs errors), `no-throw-literal`/`only-throw-error`.
- **A project rule from AGENTS.md:** `no-restricted-imports` so that `neo4j-driver` can only be imported in `src/lib/neo4j.ts`. That enforces "all database access goes through data functions" by lint instead of by memory. (Zod, `extract` and similar rules can be added the same way later.)
- `eslint-config-prettier` last in the list.

**Deliberately not added**
- `strictTypeChecked` and `stylisticTypeChecked`: noisier, more opinions than bugs. Can be revisited.
- Import sorting and naming-convention rules: low value now.
- `eslint-plugin-vitest`: only worth it once there are many tests; the basic rules in `src/**/*.test.ts` do not need it yet.

**For JavaScript files** (the only ones are config files such as `eslint.config.mjs`): they get the normal JavaScript rules, but the type-aware rules are switched off for them, since they are not part of the TypeScript project.

## In scope

- **Vitest:** `vitest` and `vite-tsconfig-paths` (so `@/` imports work in tests). `vitest.config.mts` with the default `node` environment, since the logic we test is pure. Tests live beside the code as `*.test.ts`. Scripts: `test` (watch) and `test:run` (once, for CI).
- **First real test:** move the environment check out of `src/lib/neo4j.ts` into a pure function `parseNeo4jEnv(env)` with a Zod schema, with unit tests (all set, one missing, empty string, wrong URI scheme). This is the "Zod at every boundary" rule applied to environment variables, as promised in the slice 02 plan.
- **Zod:** install `zod` (version 4).
- **ESLint:** the additions above, in `eslint.config.mjs`.
- **Prettier:** `prettier`, `eslint-config-prettier`, `prettier-plugin-tailwindcss` (sorts Tailwind classes, pointed at `src/app/globals.css` for Tailwind 4). `.prettierrc` matches the code that is already there: no semicolons, double quotes. Scripts `format` and `format:check`.
- **Git hooks:** Husky runs `lint-staged` before each commit. On staged files only, it runs `prettier --write` and `eslint --fix`. Typecheck, tests and build stay in CI so the commit stays fast. A hook can be skipped with `--no-verify`, so CI remains the real gate.
- **Scripts:** `typecheck` (`tsc --noEmit`), plus `lint`, `format:check`, `test:run`. And `check`, which runs all of them in turn, so one command before a pull request.
- **CI:** `.github/workflows/ci.yml`, on pull requests and on pushes to `main`: Node 22, `npm ci`, then typecheck, lint, format check, tests, build. Types for `LayoutProps` and routes come from `next typegen` before `tsc`, so the build is not needed just for types (the README currently says "run the build first").
- **README:** a "Checks" section (what each command does, hot reload notes, how to run tests in watch mode) replacing the "run build first" note.

## Out of scope

- Branch protection on GitHub (making CI required to merge): parked by the author for later. Revisit after CI has run a few times.
- React Testing Library, `jsdom`, Playwright or other component and end-to-end testing. Added when the first component needs a test (async Server Components cannot be unit tested with Vitest anyway).
- Editor setup files (`.vscode/`), coverage thresholds, dependency update bots.
- Fixing the `npm audit` finding that comes in through `shadcn`.
- Any new application behaviour.

## Files likely to change

- `package.json`, `package-lock.json`
- `eslint.config.mjs`
- `vitest.config.mts` (new)
- `.prettierrc`, `.prettierignore` (new; build output and lockfile only)
- `.husky/pre-commit` (new) and a `lint-staged` entry in `package.json`
- `.github/workflows/ci.yml` (new)
- `src/lib/env.ts` and `src/lib/env.test.ts` (new): `parseNeo4jEnv` and its tests
- `src/lib/neo4j.ts` (use `parseNeo4jEnv`)
- `README.md`, `docs/slices/README.md`
- Possibly many files, for the one-off Prettier formatting pass (see open question 1)

## How it will be tested

- Vitest unit tests for: `parseNeo4jEnv`.
- Manual check:
  - `npm run check` passes locally.
  - Break each tool on purpose and confirm it fails: an un-awaited promise (lint), a type error (typecheck), a badly formatted file (format check), a failing test (test). Then fix them.
  - `import neo4j-driver` in a second file and confirm the restricted-import rule fires.
  - `npm run dev` still works with hot reload (edit a component and see it update), and `/api/health` still returns ok.
  - Open the pull request and confirm the CI job runs and goes green on GitHub, and that a deliberately failing commit turns it red.
- Not tested: CI on Windows or other Node versions; the lint rule set against a large codebase (there is little code yet).

## Open questions

None. All six were answered by the author (see below).

## Decisions made during the slice

Answers to the plan's open questions (author):

1. Prettier: `src/components/ui` is included, so nothing can slip through unformatted. shadcn copies component source into the repo and overwrites it when a component is re-added or updated; if that happens, run `npm run format` afterwards. All files get one separate formatting commit.
2. Type-aware linting (`recommendedTypeChecked`): yes.
3. `next build` in CI: yes.
4. Git hooks: yes, Husky with lint-staged (lint and format on staged files before each commit).
5. Branch protection: not yet, parked for later.
6. Env schema: `src/lib/env.ts` for the Neo4j variables only, growing as variables are added.

Record anything else decided while building, with a pointer to SPEC-DECISIONS.md or an ADR.

# AGENTS.md

Instructions for any AI agent working on Moneo, the why behind the buy. Read this first in every session.

## What this project is

A personal finance web app (UK, GBP only) that shows where money goes and why: import bank statements and receipts, categorise spending, add context (mood, motivation, outcome) and see charts. The author is learning as they build, so keep things simple and explain choices.

## Where things are

- `docs/SPEC/SPEC.md`: problem, users, journeys, Gherkin scenarios, edge cases, states. The source of truth for behaviour.
- `docs/SPEC-DECISIONS/SPEC-DECISIONS.md`: log of every product decision (D-001 onwards) with the options considered and the author's answer.
- `docs/ADR/ADR-001.md`: technology stack and the list of open architecture decisions.
- `docs/slices/README.md`: the slice plan, the current slice and its status.
- `docs/slices/NN-name.md`: the plan for one slice, written just before that slice starts.
- `docs/samples/`: synthetic sample files (fake data only).

At the start of a session, read this file, the slice index, and the plan of the current slice. Read the SPEC sections that slice covers.

## How we build: one slice at a time

A slice is a thin vertical piece of the app that works end to end and can be demoed. Each slice is one pull request.

1. **The author picks the next slice.** Do not start one on your own.
2. **Write the slice plan** in `docs/slices/NN-name.md` from the template: goal, scenarios covered (from the SPEC), what is in scope, what is out of scope, files likely to change, how it will be tested, open questions. **Stop and wait for the author to approve the plan.** No code before approval.
3. **Implement on a branch** named after the slice, with tests. Stay inside the plan.
4. **Open one pull request.** The description links to the slice plan and lists the scenarios covered and anything left out.
5. **Stop.** The author reviews and merges.
6. **Only after the author confirms the merge**, update the slice index and plan the next slice.

## Hard rules

- **The human merges. Always.** Never merge a pull request, never push to `main`, never force push, never approve your own pull request.
- **Never open a pull request for the next slice before the previous one is merged.**
- **If a slice turns out bigger than planned, stop and tell the author.** Do not widen scope silently. Propose a split instead.
- **Do not decide open questions silently.** If the work needs a decision that is listed in ADR-001 as open, or that the SPEC does not cover, stop and ask. Record the answer in `SPEC-DECISIONS.md` or an ADR.
- **No real bank data in the repo or on the deployed app.** Only synthetic samples. Never commit secrets or `.env` files.
- **Do not change the SPEC or ADRs to match the code.** If the code and the SPEC disagree, raise it with the author.

## Code conventions

- TypeScript in strict mode. Next.js, React, Tailwind CSS and shadcn/ui, as in ADR-001.
- Money is GBP only, stored as integer pence. Never use floating point for amounts.
- Zod at every boundary: CSV rows, data read from storage, API requests and responses, AI output.
- Business logic lives in pure functions outside React, with Vitest tests for each function.
- AI extraction goes through the `extract` interface (live and replay implementations). Usage limits come from `getLimits(visitorId)`. Do not hard-code either.
- Demo mode and user mode are controlled by a feature flag. Code paths for one mode must not be reachable in the other.
- Every Neo4j query for demo data is scoped to the visitor. A missing visitor filter is a data leak.
- Match the style of the surrounding code. Keep changes small and reviewable.

## Pull requests

- Small enough to review in one sitting.
- Tests for the scenarios the slice covers must pass before the pull request is opened. Say so in the description, and say what you did not test.
- Do not mix refactors with feature work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

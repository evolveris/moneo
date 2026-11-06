# Slice 01: Deploy

- Status: in progress
- Journeys: none (foundation)
- Depends on: slice 00 (merged), ADR-001 (Vercel for hosting)
- Branch / PR: `slice-01-deploy` / not opened yet

## Goal

After this slice every push to `main` updates a public production site on Vercel, and every pull request gets its own preview link. The environment variables the app will need are written down, even though none are used yet.

## Scenarios covered

None. This slice has no user behaviour from the SPEC.

## In scope

- Connect the GitHub repo to a Vercel project (done by the author in the Vercel dashboard, with a short step list from me).
- Production deploys from `main`, preview deploys for each pull request.
- Check that the production URL shows the slice 00 page.
- `.env.example` listing every variable the app will need, with no values, and a section in the README explaining how to set them locally (`.env.local`) and on Vercel.
- README note with the production URL and how previews work.
- Confirm `.env*` stays ignored by git, with `.env.example` as the one exception.

## Out of scope

- Any real environment variable values or secrets (none exist yet).
- Neo4j (slice 02), CI checks on pull requests (slice 03), custom domain, analytics.
- The demo/user mode flag (open decision 16, needed before slice 15).
- Password protection or access rules for previews (see open questions).

## Files likely to change

- `.env.example` (new)
- `.gitignore` (allow `.env.example`)
- `README.md`
- `docs/slices/README.md`

No application code changes. The Vercel setup lives in the Vercel dashboard, not in the repo, unless we decide we need a `vercel.json`.

## How it will be tested

- Vitest unit tests for: nothing. No logic changes, and Vitest arrives in slice 03.
- Manual check: open the production URL and see the same page as locally. Open a pull request, wait for the Vercel preview link on it, and open that. Run `npm run build` locally before pushing.

## Open questions

1. **Vercel account:** personal (Hobby) account or a team? Hobby is free and enough here, but it is for non-commercial use. Moneo is a portfolio demo, so Hobby seems fine.
2. **Who connects Vercel to GitHub:** this needs you to log in to Vercel and grant access to the repo `evolveris/moneo`. I cannot do it for you. I will give the steps.
3. **Preview access:** by default Vercel protects preview deployments so only logged-in team members see them. For a demo you may want previews open, or to keep them private. Which do you prefer?
4. **Which variables to list in `.env.example`:** I would list only what is already decided in ADR-001 and the SPEC (Neo4j connection details, the AI provider key, the mode flag). The AI provider and the mode flag are still open decisions, so I would leave those out until they are decided. Is that right?

## Decisions made during the slice

- Vercel Hobby account (author's answer).
- Vercel project was created by the author in the dashboard, production URL https://moneo-neon.vercel.app/.
- `.env.example` lists only the Neo4j variable names (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`). The AI key and the mode flag wait for their decisions.
- Preview access: left at the Vercel default, to be revisited if needed.

# Slice 03a: Design

- Status: plan written, waiting for approval
- Journeys: J2, J5, J6, J7, J8 (screens only; nothing is built)
- Depends on: slice 03 (merged). Feeds slice 04 (domain core) and every UI slice after it.
- Branch / PR: `slice-03a-design` / not opened yet

## Goal

Decide what the screens show and what the user can do on each, before the domain core is built, so the lists, schemas and fields in slice 04 come from real screens and not from guesses. The output is decisions in the SPEC and a short list of what slice 04 must contain. The mockups are throwaway.

## Scenarios covered

None are made to pass. No application code changes. This slice settles open product questions that the J2 to J8 scenarios depend on.

## In scope

- Review the four draft mockups already on the branch (HTML, dark only, fake data, under `docs/design/mockups/`):
  1. Import and review (source step, review by exception, all rows, needs-fix blocker)
  2. Transactions table (populated, inline edit, category change with undo, filtered to nothing, empty, error)
  3. Context entry (side panel with mood, motivation, outcome and a note; none, partial, complete, too long, cleared with undo)
  4. Insights (category chart, 12-month trend, behaviour view, table alternative)
- Decide the draft assumptions the mockups list as unconfirmed: top bar navigation with Import as its own page, dark only, desktop-first with a card layout on narrow screens, accent colour, tone.
- Draft the lists that slice 04 needs: the **category list**, and the **mood, motivation and outcome lists** (J7, D-002 left them to draft). Settle the colour per category (six fixed colours are in the draft).
- For each screen, write down which fields it reads and writes. This is the input for the Zod schemas in slice 04.
- Record answers in `SPEC-DECISIONS.md` (D-037 onwards) and update the SPEC where a screen changes a journey. Raise anything that conflicts with the SPEC; do not edit around it.
- A short "what slice 04 must contain" note at the end of this plan.

## Out of scope

- Any application code, components, Tailwind setup or shadcn work. (That is slice 05 onwards.)
- Light mode, if we confirm dark only.
- Finance education screens (ADR-001 open decision 11).
- The agentic loop screens (D-036): not designed until after the charts.
- Final branding, logo, typography beyond what is already chosen.
- A design system, tokens or Figma. The mockups stay plain HTML.
- Deciding the Neo4j data model (separate ADR, before slice 05).

## Files likely to change

- `docs/design/mockups/*` (the existing draft, adjusted after review)
- `docs/SPEC/SPEC.md` (only where a decision changes a journey, with the author's approval)
- `docs/SPEC-DECISIONS/SPEC-DECISIONS.md`
- `docs/slices/README.md` (add this slice to the index)
- `docs/slices/03a-design.md`

## How it will be tested

- Vitest unit tests for: none (no code).
- Manual check: you open each mockup in a browser, click through every state with the bar at the bottom, and check it against the journeys in the SPEC. I check that every field a screen shows maps to something in the SPEC, and that every Gherkin scenario in J2 to J8 has a screen state to land on. A narrow window shows the card layout.
- Not tested: real devices, accessibility with a screen reader (colour contrast and "nothing depends on colour" are checked by design only).

## Open questions

1. **How much design?** Review and decide on the four existing mockups only, or also add missing screens (for example the demo checklist and sample picker for J9, J10, and the reset flow)? I would keep to the four plus the demo layer already in the draft, and leave J9 and J10 until slice 15.
2. **Navigation:** top bar with Import as its own page, as drafted. OK?
3. **Dark only, desktop first:** OK, or do you want a light mode or mobile first?
4. **Categories:** the list is a placeholder. Do you want to draft it from your own spending, or should I propose about 10 to 12 to start from? (Must include "Income" and "Transfers", D-002.)
5. **Mood, motivation and outcome lists:** draft together, one list at a time, about 8 values each? Should the AI-interpretation idea (D-036) influence them now, for example a motivation list that later AI labels can reuse?
6. **Slice number:** I called this `03a` because that is what the branch is named. Keep it, or renumber the index so the design slice is 04 and everything shifts by one? I would keep 03a to avoid renumbering the plan and the SPEC references.
7. **Branch:** `slice-03a-design` was cut before slices 01 to 03. I would rebase it onto `main` before starting. OK?

## What slice 04 must contain

Filled in at the end of this slice, from the decisions above.

## Decisions made during the slice

Record anything decided while building, with a pointer to SPEC-DECISIONS.md or an ADR.

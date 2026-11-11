# Slice 03a: Design

- Status: in review
- Journeys: J2, J5, J6, J7, J8 (screens only; nothing is built)
- Depends on: slice 03 (merged). Feeds slice 04 (domain core) and every UI slice after it.
- Branch / PR: `slice-03a-design` / see the pull request

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

All seven original questions are answered (see below). What is still open after the first design review is listed in the SPEC under "Still open": how a dismissed demo checklist is reopened, the landing page when there is no data, and future dates.

## What slice 04 must contain

From the decisions D-037 to D-048 and `docs/design/screen-fields.md`:

- **Money:** integer pence type and helpers (parse, format, never floats).
- **The fixed lists as typed constants:** 11 categories, 8 moods, 9 motivations, 6 outcomes (SPEC, Fixed lists), with Zod enums built from them.
- **Zod schemas:** the stored `Transaction` (date as a real calendar date, `amountPence` integer, non-empty description, `category` required, `categorySource` `ai | user`, optional `merchantName`, an optional `context` object with required `mood` and `motivation` and optional `outcome` and `note` of at most 200 characters, the `original` values, `importId`, `sourceType`); the review row (adds `rowState`, `problems`, `duplicateOf`, `include`, optional `runningBalance`); the import summary and balance check.
- **Derived values as pure functions with tests:** `merchantKey` (digits and references stripped, lower-cased, trimmed), `edited`, `contextState` (`none` or `complete`), `kind` (spending, income, transfer, refund).
- **Limits config:** one config file holding the note length (200), undo window (10 s), file size, page and row limits, and `getLimits(visitorId)`.
- **Mode flag:** demo or user, read in one place.
- **Not in slice 04:** the data model in Neo4j (separate ADR before slice 05), any UI, the AI `extract` interface (slice 08).

## Decisions made during the slice

Answers to the plan's open questions (author):

1. Scope: the four existing mockups plus the demo layer already in the draft; J9 and J10 screens wait for slice 15. (The checklist panel itself is not mocked.)
2. Navigation: tabs in the order Insights, Transactions, Import (D-038).
3. Dark only, desktop first, with the card layout on narrow screens kept for the transaction screens (D-048).
4. Categories: decided (D-042).
5. Mood, motivation and outcome lists: decided (D-042).
6. Keep the number `03a`.
7. The branch was rebased onto `main` before starting.
8. The mockups stay plain HTML with their own CSS, not shadcn components. The first real screen is built with shadcn from slice 05, using these decisions. (Assumed; the author did not object.)

Decisions from the first design review, all logged in `SPEC-DECISIONS.md` and applied to the SPEC, `screen-fields.md` and the mockups:

- D-037: a row with no category cannot be saved.
- D-038: tab order Insights, Transactions, Import; Insights sections Behaviour, By category, 12-month trend.
- D-039: reset wipes everything and lands on Import, "Choose source".
- D-040: the mood-by-category chart is deferred.
- D-041 and D-049: the header "Checklist" button and the checklist panel are replaced by "Start import demo" (no data) or "Reset demo" (has data).
- D-050: a Saved screen after an import, with a "See your insights" button.
- D-042: the fixed lists, and one colour per category in the charts (eight hues plus grey for Other, validated).
- D-043: context tags with a "View context" dialog.
- D-044: mood and motivation are required to save context; no partial state.
- D-045: note limit of 200 characters.
- D-046: merchant name is its own field.
- D-047: future dates deferred.
- D-048: icons, accent touches, 30px logo, "Project repo" link.

Changes made to the mockups beyond the feedback list: one shared header injected by `mockup.js` (so the four pages stay consistent), a reset confirmation dialog that lands on Import, a narrow-screen header that wraps the tabs onto their own row (the tabs were hidden on phones before), and a "Load demo data" card on the Import page in demo mode.

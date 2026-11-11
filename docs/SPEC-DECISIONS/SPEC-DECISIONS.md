# SPEC decisions log

History of decisions made while writing the "User journeys + BDD" section of `SPEC.md`. `SPEC.md` holds the current state; this file holds how we got there. Architecture-level decisions graduate to ADRs.

Status: `open` (asked, not answered), `decided`, `deferred` (consciously postponed).

---

## D-001: Receipts and existing transactions

- Journey: J4
- Status: decided
- Question: When a receipt matches a stored bank transaction (same date and total), should it attach to it or always be a separate transaction? v1 stores only the total, so attaching adds nothing yet.
- Options: (a) new transaction only, no matching; (b) attach receipt image; (c) attach and store line items.
- Recommendation: (a), with a "possible duplicate" warning in review using the CSV duplicate check.
- Answer: (a). A receipt is always its own new transaction, with a "possible duplicate" warning in review if a bank row matches. Attaching and line items later, with the data model ADR.
- Affects: SPEC J4

## D-002: Fixed vs user-defined categories and moods

- Journey: J6, J7
- Status: decided
- Question: Who defines the category and mood lists in v1, and is free text a fallback?
- Options: (a) fixed categories and moods defined in code, plus a free-text note; (b) fixed categories, user-defined moods; (c) both user-defined.
- Recommendation: (a). Draft about 8 moods together before building.
- Answer: (a). Fixed categories and moods defined in code, plus a free-text note. Categories include "Income" and "Transfers". Mood list still to be drafted (see J7).
- Affects: SPEC J6, J7, J8

## D-003: Review friction on large imports

- Journey: J2, J5
- Status: decided
- Question: What should the review screen look like for a 4,000-row import, so confirmation stays meaningful?
- Options: (a) same screen, virtualised list; (b) review by exception plus summary totals, expandable; (c) skip review above a threshold.
- Recommendation: (b). Summary totals let the user check against their bank balance.
- Answer: (b), review by exception plus summary totals. More implementation detail needed (what each part of the screen shows, what blocks confirm); being specified in the J2/J5 round.
- Affects: SPEC J2, J5

## D-004: Real statements on the deployed app

- Journey: J1, J2, J9
- Status: decided
- Question: How hard should the guard be against real bank data on the deployed demo?
- Options: (a) banner only; (b) banner plus required checkbox per upload; (c) deployed demo accepts only shipped sample files.
- Recommendation: (c). It is the only option that guarantees ADR-001 constraint 1.
- Answer: (c), because we don't want real data yet. The deployed demo accepts only the shipped sample files; real uploads only in local or private environments.
- Affects: SPEC shared rules, J1, J2, J9

## D-005: Shared vs per-visitor demo data

- Journey: J1, J10, J11
- Status: decided
- Question: Without auth, do all visitors share one dataset, or does each get their own?
- Options: (a) one shared dataset; (b) per-visitor demo dataset keyed by cookie, expiring; (c) shared read-only dataset plus per-visitor sandbox.
- Recommendation: (b), with the two-person real use running in a separate non-demo mode.
- Answer: (b). Each visitor gets their own cookie-keyed demo copy that expires. Two-person real use runs separately.
- Affects: SPEC J1, J10, J11, rate limits; ADR-001 open decisions 2 and 6

## D-006: Income and refunds in spending charts

- Journey: J8
- Status: decided
- Question: What does "charts of spending exclude income" mean precisely?
- Answer: Clarification requested. Draft rule: spending charts use negative amounts only; refunds net against their category; income (positive amounts in the "Income" category) is a separate monthly total and never in spending charts. Needs confirming once D-002 fixes the category list (an "Income" category must exist).
- Affects: SPEC shared rules, J8

## D-007: "Excluded" flag on transactions

- Journey: J7, J8
- Status: decided
- Question: Does the user need a flag to leave a transaction out of charts?
- Answer: Not wanted for now, as it was unclear what value it adds. Removed from the SPEC. Revisit if transfers between own accounts or one-off large items skew the charts; a "Transfers" category in D-002 may cover it.
- Affects: SPEC shared rules, states, J7, J8

## D-008: Usage limits and where they are configured

- Journey: all import journeys
- Status: decided
- Question: What are the AI usage limits, and how can they be changed quickly?
- Answer: Limits accepted, with AI-backed uploads lowered to 5 per visitor per hour. All limits must live in one clearly named place in the code, with a way to override them for one particular user quickly. Mechanism for the per-user override is still to decide (code constant, env var, or database row).
- Update: the per-visitor override mechanism is deferred to ADR-001 open decision 16 (same tool as the mode flag). A global daily cap on AI calls was added by D-032.
- Update: start with an environment variable (JSON, keyed by visitor ID) read through one function, `getLimits(visitorId)`. Revisit in ADR-001 open decision 16.
- Affects: SPEC shared rules; ADR-001 consequences (token usage)

## D-009: Demo mode as a config flag

- Journey: J1, J2, J9
- Status: decided
- Question: How does the sample-files-only rule (D-004) work for live demos run locally?
- Answer: Sample picker (no file picker) in demo mode, agreed. Demo mode must be switchable on locally, so it is a config flag and not tied to the deployed environment. With it off, the normal file picker is used.
- Update: the user confirmed two modes (demo mode and user mode) controlled by a feature flag. Mechanism recorded as ADR-001 open decision 16.
- Affects: SPEC shared rules, J2, J9

## D-010: Sample files, live AI and replay

- Journey: J2, J3, J4, J9
- Status: decided
- Question: Do sample files run through the live AI, replay stored results, or both?
- Answer: (c). Live AI on samples, replay of a stored result when the limit is hit. Replay is a fixture of the validated AI output per sample, behind an `extract` interface with `live` and `replay` implementations (one LangGraph node), labelled in the UI, with a test that fixtures still pass the Zod schema. Also usable for Vitest.
- Affects: SPEC J9, limits (D-008)

## D-011: Duplicate rule

- Journey: J2, J5
- Status: decided
- Superseded by D-035.
- Answer: (b). Same bank transaction ID when the file has one, otherwise same date, amount and raw description.
- Affects: SPEC J2, settled decisions

## D-012: Categorise before or after confirm

- Journey: J2, J5, J6
- Status: decided
- Answer: (a). Categories are assigned before review. Low-confidence categories appear in the exceptions list and do not block saving.
- Affects: SPEC J5, J6; ADR-001 open decision 4

## D-013: Balance check in review

- Journey: J5
- Status: decided
- Answer: (b), optional, warns but does not block. Spec note: a check needs both opening and closing balance (opening + net = closing), so the SPEC has both fields, prefilled when the file contains them.
- Affects: SPEC J5

## D-014: How a CSV is read

- Journey: J2
- Status: decided
- Question: Does the AI read CSV rows, or a deterministic parser?
- Answer: Deterministic parser for CSV; AI for PDFs and images. AI column mapping (the model looks at the header and a few rows once per file and proposes the mapping, the parser does the rest) is wanted as a learning goal and is recorded as ADR-001 open decision 12 instead of being fixed here. An RBS preset is wanted. RBS export columns are not yet verified from an official source; a sample export is needed.
- Update: a second web search still found no official RBS or NatWest page for the consumer CSV, and third-party guides disagree on the columns (single Value column vs separate money in and out, balance present or absent, year present or absent). Two synthetic sample files were written in `docs/samples/` (the layout we expect, and an alternative layout). Verify against a real export before building the preset.
- Update: no real RBS export is available yet. Decision: use the synthetic file as the RBS preset's fixture and assume it is correct, labelled "assumed format". Demo mode only uses sample files, so the real format does not matter for the demo. A preset applies only when the header row matches exactly; otherwise the file is rejected with "unrecognised layout" instead of being misread. To be checked against a real export before user mode is trusted.
- Affects: SPEC shared rules, J2; ADR-001 open decisions 4, 10, 12

## D-015: PDF statement scope

- Journey: J3
- Status: decided
- Answer: (a). Current account statements only. Credit card and savings statements (different layouts and sign conventions) come later.
- Affects: SPEC J3

## D-016: One file or several per import

- Journey: J2, J3
- Status: decided
- Answer: (a). One file per import. A CSV covers a whole year in one file, so it is the route for bulk history.
- Affects: SPEC J3

## D-017: Source references for AI extraction

- Journey: J3, J4, J5
- Status: deferred
- Question: Should review help the user check AI-extracted rows against the original file (page number, side-by-side)?
- Answer: Not implemented in v1. The user takes responsibility for AI misreads for now. Recorded as ADR-001 open decision 13 to revisit. Open point: whether a receipt photo is still shown beside its single proposed transaction (assumed yes, to confirm in J4).
- Affects: SPEC J3, J4; ADR-001 open decision 13

## D-018: Manual entry for unreadable receipts

- Journey: J4
- Status: decided
- Answer: (a). Retake or discard only. No manual entry form in v1.
- Affects: SPEC J4

## D-019: Receipt photo in review

- Journey: J4
- Status: decided
- Answer: (b). No photo beside the proposed transaction, consistent with D-017, because it would need a separate modal and the user wants to keep v1 simple.
- Affects: SPEC J4; resolves the open point in D-017

## D-020: What "low confidence" means for categorisation

- Journey: J5, J6
- Status: decided
- Answer: (b). The model picks a category from the fixed list or answers "unknown"; only "unknown" is an exception in review. No confidence score or threshold. The user wants to understand AI confidence better, recorded as ADR-001 open decision 14.
- Affects: SPEC J5, J6; ADR-001 open decision 14

## D-021: What a category override affects

- Journey: J6
- Status: decided
- Answer: (b). An override offers to apply to the other stored transactions of the same merchant (one undo reverts all). It is not remembered for future imports in v1. Open: how "same merchant" is decided, recorded as ADR-001 open decision 15.
- Affects: SPEC J6; ADR-001 open decisions 1, 4, 15

## D-022: What counts as "same merchant" in v1

- Journey: J6
- Status: decided
- Answer: (a). The description with digits and reference numbers stripped, lower-cased and trimmed, matched exactly. Upgrade (both code normalisation and AI-named merchant) recorded in ADR-001 open decision 15.
- Affects: SPEC J6; ADR-001 open decision 15

## D-023: Shape of the context fields

- Journey: J7, J8
- Status: decided
- Answer: (a). Three fields (mood, motivation, outcome), pick one from a fixed list each, plus an optional free-text note. Starter lists: mood: happy, stressed, bored, sad, anxious, excited, calm, tired. Motivation: need, planned, habit, impulse, treat, social pressure, deal or sale. Outcome: glad I bought it, regret it, used it, unused, returned. Lists open to editing before building.
- Affects: SPEC J7, J8; ADR-001 open decision 1 (data model)

## D-024: Charts in v1

- Journey: J8
- Status: decided
- Answer: (a). Three charts: spending by category for a chosen month; spending per month for the last 12 months stacked by category; a behaviour chart grouped by a chosen mood, motivation or outcome. Clicking a slice or bar filters the transaction list.
- Affects: SPEC J8

## D-025: Definition of a month

- Journey: J8
- Status: decided
- Answer: (a). Calendar month. Pay-cycle months are a possible later option.
- Affects: SPEC J8

## D-026: Behaviour chart with little context

- Journey: J8
- Status: decided
- Answer: (b). Show the chart with a "No context" group, a coverage line (share and amount of spending with context), and a prompt to add context to the largest transactions without it.
- Affects: SPEC J8

## D-027: Form of the guided demo

- Journey: J9
- Status: decided
- Answer: (b). A checklist panel with items linking to the right place and ticking when done, in any order.
- Affects: SPEC J9

## D-028: Showing invalid states in the demo

- Journey: J9
- Status: decided
- Answer: Only the "Try a bad file" samples show invalid states. No "simulate AI failure / limit / database" switches, and no demonstration of app-level failures for now. Demo data includes incomplete records (uncategorised, missing context) so the user can see prompts to edit.
- Affects: SPEC J9

## D-029: When the checklist appears

- Journey: J9
- Status: decided
- Answer: (a). Automatically for a first-time visitor in demo mode, dismissible, reopenable from the header. Not shown in user mode.
- Affects: SPEC J9

## D-030: Reset and expiry in demo mode

- Journey: J10
- Status: decided
- Answer: (a). "Reset demo" wipes the visitor's own copy to the empty state. The copy also expires after 24 hours of inactivity, set in the config file. Reset is not offered in user mode.
- Affects: SPEC J10

## D-031: Two of us, and where real data lives

- Journey: J11
- Status: decided
- Answer: (a). J11 is deferred until auth exists. In v1, user mode is one dataset on one machine, shared by sharing the machine or browser. Cross-device scenarios are written and tagged for after auth. Noted on ADR-001 open decision 2.
- Affects: SPEC J11; ADR-001 open decision 2

## D-032: Clearing cookies resets the per-visitor limit

- Journey: J1, J2
- Status: decided
- Answer: (c) plus (a). Accept that clearing cookies resets the per-visitor limit, and add a global daily cap on AI calls across all visitors as a backstop. When the cap is hit, samples run through replay (D-010). No IP-level cap.
- Affects: SPEC shared rules, J1

## D-033: Assumptions confirmed

- Journey: J2, J5, J8
- Status: decided
- Answer: All confirmed. (1) Refresh during review loses the review; the user is happy with this for v1, but wants it recorded as ADR-001 open decision 17 because a real user is likely to feel lots of pain. (2) Cancelling saves nothing. (3) Refunds net against their category. (4) Limits: 5 MB, 10 PDF pages, 5,000 rows. (5) Undo window 10 seconds. (6) The state model in the SPEC.
- Affects: SPEC States, J5, J8; ADR-001 open decision 17

## D-034: Date, amount and raw description become editable

- Journey: J2, J3, J4, J5, J6
- Status: decided
- Question: Imported fields were immutable (SPEC shared rules, ADR-001 open decision 5). The user wants date, amount and raw description editable in case the AI misreads them.
- Answer: Allowed in principle. Details to settle: where they are editable (review only, or also after saving), and how duplicate detection works once a stored value has been edited. SPEC shared rules and ADR open decision 5 are to be updated once settled.
- Update: editable in review and on stored transactions (Q30 b). This assumes the table can edit inline with 5,000 rows, recorded as ADR-001 open decision 18 (spike before committing). Duplicate handling after an edit is still being settled: the transaction ID cannot be relied on (see D-011).
- Final: allowed in review and on stored transactions (Q30 b), validated by Zod, with original imported values kept and an "edited" marker. Edits join the 10-second undo. TanStack Table with TanStack Virtual chosen for the table; spike still to verify (ADR-001 open decision 18).
- Affects: SPEC shared rules, J5, J6, duplicates (D-011); ADR-001 open decision 5

## D-035: Duplicate rule revised (replaces D-011)

- Journey: J2, J5, J12
- Status: decided
- Question: A transaction ID cannot be relied on (the expected RBS layout has none; PDFs and receipts never do). How are duplicates found, including after an edit?
- Answer: Agreed. Match on date, amount and raw description, plus the running balance when the file has one. Transaction ID only as an extra if present. Match by count, so identical rows are not collapsed. Match on the original imported values, kept on each transaction, so edits do not cause re-imports.
- Affects: SPEC J2, J5, J12; supersedes D-011

## D-036: The agentic loop: AI interprets notes and writes derived data back

- Journey: none yet (new, after J8 charts)
- Status: decided (direction); journey, label list and scenarios deferred
- Question: Where does AI sit in the product beyond reading files and categorising? The author wants AI to read their own notes about a purchase, interpret them, and feed the result into the charts.
- Options: (a) interpret on the fly each time a chart is drawn, nothing stored; (b) store the interpretation back in Neo4j as derived data, linked to the transaction and marked as AI-made.
- Answer: (b). Workflow: Neo4j (notes) -> data function -> LangGraph.js workflow -> Zod -> data function -> Neo4j (derived data) -> charts. Output is a fixed label list or "unknown". The author wants to build the LangGraph workflow themselves and own the whole flow; this is the main learning goal of the "agentic" part. Privacy of notes sent to the AI provider is not a concern for now (personal app, synthetic demo data).
- Affects: SPEC product vision ("The agentic loop"); ADR-001 open decisions 1 (data model must leave room for derived data), 9, 14; usage limits (D-008)

## D-037: A row with no category cannot be saved (replaces part of D-012 and D-020)

- Journey: J2, J5, J6, J8, J9
- Status: decided
- Question: D-012 and D-020 let an unknown category through review, saved as uncategorised. The mockups showed it as a quiet flag. Should it block saving?
- Answer: Yes. A row with no category keeps its "? Unknown category" flag and counts as an exception, and "Save transactions" is disabled until every row has a category (or is dropped). Reason: no category means low-quality data. The AI can still answer "unknown" (D-020); the user picks the category in review. As a result `uncategorised` is removed as a category source (only `ai` and `user` remain), the "Uncategorised" slice and the `partial` view state disappear, and the demo data (J9) no longer contains uncategorised rows.
- Affects: SPEC States, J2, J5, J6, J8, J9; supersedes D-012 and D-020 where they say an unknown category does not block saving

## D-038: Navigation order and Insights sections

- Journey: all screens
- Status: decided
- Answer: The tabs are Insights, Transactions, Import, in that order, because most time will be spent in Insights. In Insights the sections are Behaviour first, By category second, 12-month trend third.
- Affects: SPEC shared rules, J8

## D-039: Reset wipes everything and lands on Import

- Journey: J10, J1
- Status: decided
- Answer: "Reset demo" wipes the visitor's whole copy, and it behaves the same from Insights, Transactions and Import. After the confirmation the app returns to Import on "Choose source". In demo mode that step also offers "Load demo data" next to the sample files, so a reset can lead straight back to demo data. The first-visit landing page when there is no data is proposed to be the same view and is marked [Proposed] in the SPEC.
- Affects: SPEC J1, J10, App state

## D-040: Mood-by-category chart is not added for now

- Journey: J8
- Status: deferred
- Answer: The idea of a chart correlating mood with spending category (what is spent on when happy or stressed) is left out of the mockups and J8 for now. Revisit with the agentic loop (D-036).
- Affects: SPEC J8

## D-041: Remove the header "Checklist" button

- Journey: J9
- Status: decided (button); open (reopening)
- Answer: The header button is removed. The guided demo checklist itself (D-027, D-029) stays. Still open: how a dismissed checklist is reopened, or whether it is not. The SPEC marks the reopen behaviour [Proposed] until the author answers.
- Affects: SPEC J9

## D-042: Fixed lists: categories, motivation and outcome

- Journey: J6, J7, J8
- Status: decided
- Answer: Spending categories: Groceries, Eating out, Transport, Housing, Bills and utilities, Subscriptions, Shopping, Health and fitness, Other; plus Income and Transfers, which stay out of the spending charts (D-006). Entertainment and Travel were considered and dropped. Mood is unchanged (happy, stressed, bored, sad, anxious, excited, calm, tired). Motivation: need, planned, habit, impulse, treat, social pressure, deal or sale, social media, unwell (feeling under the weather, or buying for health reasons). Outcome: glad I bought it, regret it, used it, unused, returned, sold. The lists are fixed in code (D-002).
- Chart colours: every category has its own colour, not grouped. Eight hues in a fixed slot order (blue, orange, aqua, yellow, magenta, green, violet, red) for the eight categories, and grey for Other, so a category keeps its colour in every chart. Checked with the dataviz palette validator on the dark surface: lightness, chroma, contrast and the adjacent-pair colour-blind and normal-vision checks pass (worst adjacent colour-blind difference 8.4). Some non-adjacent pairs (for example magenta and aqua under deuteranopia) are hard to tell apart, so every mark carries a direct label or value and each chart has a legend and a table view.
- Affects: SPEC fixed lists, J6, J7, J8; supersedes the starter lists in D-023 and the "mood list still to be drafted" in D-002

## D-043: Context in the transaction table

- Journey: J7
- Status: decided
- Answer: The Context column shows small tags for each of mood, motivation and outcome that is set, with a "View context" link that opens a read-only dialog (date, amount, category, the three values, the note, and an "Edit context" action). A quiet "Add context" prompt stays where there is none.
- Affects: SPEC J7

## D-044: Mood and motivation are required to save context

- Journey: J7, J8
- Status: decided
- Answer: Mood and motivation are the "why" behind the buy, in the author's words "the exact thing that will make the app valuable". Both are required to save any context. Outcome and the note are optional, and the outcome can be added later. A transaction therefore has no context or a complete context, and the `partial` context state (D-033) is removed.
- Affects: SPEC States, J7, J8

## D-045: Note length limit of 200 characters

- Journey: J7
- Status: decided
- Answer: The note is limited to 200 characters, one value in the config file. Reason: notes are read by the AI for interpretation (D-036) and could be added to many transactions at once, so the token cost matters. 200 characters is about 50 tokens, so 1,000 notes is about 50,000 tokens. 140 was considered and can be set later by changing the config value.
- Affects: SPEC J7, shared rules

## D-046: Merchant name is its own field

- Journey: J4, J6
- Status: decided
- Answer: A transaction can store a clean `merchantName` as its own optional field. Receipts fill it; CSV rows leave it empty for now. How merchants are matched in general is still ADR-001 open decision 15.
- Affects: SPEC J4, data model (ADR-001 open decision 1)

## D-047: Future dates

- Journey: J4, J12
- Status: deferred
- Answer: The SPEC lets a future date through with a warning (receipts, edits). The author's view is that it should probably be allowed only for scheduled direct debits and standing orders. Not decided; revisit when import and editing are built.
- Affects: SPEC J4, J12

## D-048: Visual details from the first design review

- Journey: all screens
- Status: decided
- Answer: Icons on the tabs and in the import step indicator, with arrows between steps instead of numbers. Accent touches (a gradient logo mark, a gradient line under the header, accent on the active tab) because the design felt bland. Logo at 30px. A "Project repo" link with the GitHub icon to the right of "Reset demo". Click-to-edit cells in the table (D-034). The card layout on narrow screens is kept for the transaction screens. All colours are still placeholders.
- Affects: the mockups; later the UI slices

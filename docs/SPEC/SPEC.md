# Moneo

*The why behind the buy.*

## Problem statement

I need to take ownership of my finances back. My banking app shows me what I spend, but not why, so I have no real visibility over my expenditure behaviour: the habits, moods and motivations behind my purchases. I am also not financially educated, and I’d like to change that. I need a place where seeing what I do with my money compels me to learn more about financial concepts such as budgeting, investing, mortgages and pensions. I am not looking for a financial advisor. Instead, with the knowledge that I gain from seeing my finances in a new light, I want to feel empowered to make financial decisions myself.

I’ll know it’s working when I can explain where my money went and why, and when I make financial decisions I understand rather than ones I put off.

## Product vision

1. Expense overview: import bank CSVs, PDFs, receipts; auto-categorise spending, and see the honest picture, along with the possibility to add a context (why did I buy, how did I feel about that, what ended up happening with that purchase) for each spending item.
2. Category-driven and behaviour-driven expense overview: charts showing where my money goes every month.
3. UK finance education: plain-language guides to budgeting, private pensions, investment types, HMRC benefits, and mortgages - depending on my specific expenditure behaviour.

### The agentic loop (D-036)

The core of what I want to build, and to own end to end: AI that reads what I wrote about my spending, interprets it into a fixed set of labels, and writes the result back to the database, so the charts can show it. I want to understand every hop, in particular how the data travels to and from the AI, and to build the LangGraph.js workflow myself.

```
  Neo4j (on Aura)                                  charts
  transactions, my notes,                             ^
  mood / motivation / outcome                         |  chart queries read
        |                                             |  the derived labels
        |  1. data function reads                     |
        |     the notes (scoped to the visitor)       |
        v                                             |
  LangGraph.js workflow  (server only)                |
    - build the prompt from the notes                 |
    - call the model, asking for a fixed label        |
      list or "unknown"                               |
        |                                             |
        |  2. model output (untrusted text)           |
        v                                             |
  Zod validates: label is in the fixed list,          |
  shape is right, otherwise rejected                  |
        |                                             |
        |  3. valid result only                       |
        v                                             |
  data function writes the derived data  ------------>+
  (linked to the transaction, marked as AI-made)
        |
        v
  Neo4j (on Aura)
```

Rules for the loop:
- The AI never touches the database or the charts. It only receives text from a data function and returns text that Zod checks. Only validated results are written.
- Output is a fixed label list or "unknown", never free-form labels, so charts keep a stable set of categories (same principle as category choice, D-002, D-012).
- Derived data is stored back in Neo4j as its own thing, marked as AI-made and kept apart from what I entered, so I can inspect, correct or delete it (D-036).
- The whole loop is subject to the same usage limits as other AI calls (`getLimits`, D-008).

Status: direction only. The journey, the label list and the scenarios are not written yet, and the data model must leave room for derived data (ADR-001 open decision 1). It comes after the charts.

## Users

Myself - this app is intended for personal use, by myself and my partner.

Demo users - the app is also intended for demo users who would like to see how it works, so a demo workflow should take them through the main flows and states of the app (including invalid data or app state).

For the purposes of the first version of this app, all users should be able to access the app without auth.

## User journeys + BDD

Status: draft, grilled with the author. Every decision is traced to `SPEC-DECISIONS.md`. Items marked **[Proposed]** are still unconfirmed.

Scope of this section: import, categorise, context, and charts. Finance education is out of scope for now (see ADR-001 open decision 11).

### Personas

- **User**: me or my partner. Uses the app for real spending (locally, or on the deployed app once auth exists). No auth in v1, so both of us see the same data.
- **Demo user**: someone with the public link (for example a recruiter). Wants to see the main flows and states quickly, including what happens with bad input. Works only with demo data.

### Shared rules (apply to every journey)

- Money is GBP only, stored as integer pence. A row in another currency is rejected with a reason.
- Spending is a negative amount; income and refunds are positive. The spending charts use negative amounts only, with refunds netted against the category they were categorised under. Income (positive amounts categorised as "Income") never appears in the spending charts; it is shown as a separate monthly total. (D-006, D-033)
- Editable fields are **date**, **amount**, **raw description**, **category** and **context**, in review and on stored transactions, because the AI can misread a file (D-034). Every edit is validated with Zod (amount as integer pence, date as a real date). The original imported values are kept on each transaction, used for duplicate matching, and an edited transaction shows an "edited" marker. Edits join the undo of category changes and context clearing. There is still no manual entry of new transactions (D-018).
- CSV files are read by a deterministic parser; the AI is never used to read amounts. How the parser learns a bank's column layout (presets, AI mapping, or both) is ADR-001 open decision 12. RBS is the first supported bank. (D-014)
- Every AI result is validated with Zod and shown to the user for confirmation before anything is saved.
- Limits: max file size 5 MB, max 10 PDF pages, max 5,000 rows per import, max 5 AI-backed uploads per visitor per hour. All limits live in one config file in the code (for example `src/config/limits.ts`), with an optional per-visitor override keyed by visitor ID, so a limit can be changed quickly for one particular user. For now overrides are read from an environment variable (JSON, keyed by visitor ID) through a single function, `getLimits(visitorId)`, so the mechanism can change later (ADR-001 open decision 16). On top of the per-visitor limit there is a global daily cap on AI calls across all visitors; when it is reached, samples run through replay (D-010, D-032). A visitor who clears cookies gets a fresh per-visitor limit; the global cap bounds the cost. (D-008)
- The deployed app shows a persistent banner: "Demo data only." Demo mode is a config flag, not tied to the deployment: it is on in the deployed app, and can be switched on locally for a live demo. In demo mode there is no file picker; the visitor chooses from the shipped sample files, never real bank statements. With demo mode off (local or private use), the normal file picker is available. (D-004, D-009)
- Each visitor to the deployed demo gets their own copy of the demo data, keyed by a cookie and expiring after a few hours. Nothing a visitor does affects another visitor. (D-005)
- Navigation: three tabs in this order, **Insights**, **Transactions**, **Import**, because most time is spent in Insights. Inside Insights the sections are Behaviour, By category, then 12-month trend. (D-038)
- Every saved transaction has a category. A row without one cannot be saved: it keeps a "? Unknown category" flag in review and "Save transactions" stays disabled until a category is picked or the row is dropped. (D-037)
- Context is mood and motivation (required, together) plus an optional outcome and an optional note of at most 200 characters, held in the config file. A transaction has either no context or a complete one. (D-044, D-045)
- A transaction can carry a clean merchant name as its own optional field; receipts fill it, CSV rows leave it empty for now. (D-046)

### Fixed lists (D-042)

Fixed in code. No custom values in v1 (D-002).

- **Category (11):** Groceries, Eating out, Transport, Housing, Bills and utilities, Subscriptions, Shopping, Health and fitness, Other, Income, Transfers. Income and Transfers never appear in the spending charts (D-006).
- **Mood, "how I felt" (8):** happy, stressed, bored, sad, anxious, excited, calm, tired.
- **Motivation, "why I bought it" (9):** need, planned, habit, impulse, treat, social pressure, deal or sale, social media, unwell (feeling under the weather, or buying for health reasons).
- **Outcome, "what happened" (6):** glad I bought it, regret it, used it, unused, returned, sold.

### States (D-033)

**App state**

| State | Meaning | What the user sees |
|---|---|---|
| Empty | No transactions stored | The app opens on Import, "Choose source", which offers "Load demo data" (demo mode) or the file picker. Insights and Transactions show an empty state that points to Import (D-039) |
| Populated | At least one transaction | Transaction list and charts |
| Resetting | Demo data being reset | Disabled actions, progress indicator |
| Error | Database or server unreachable | Error message with retry; no partial data shown |

**Upload state**

`idle` -> `validating` (type, size, page count) -> `extracting` (AI or CSV parser) -> `reviewing` (user confirms) -> `saving` -> `saved`

Terminal alternatives: `rejected` (failed validation before extraction), `failed` (extraction or save error), `cancelled` (user left review).

**Row state inside review**

`valid`, `needs-fix` (Zod error, for example unparseable date), `duplicate` (already stored), `dropped` (removed by the user). A row with no category is flagged "? Unknown category" and counts as an exception that blocks saving, like `needs-fix` (D-037). Only `valid` rows are saved. The user can fix `needs-fix` rows inline, pick a category, or drop rows, and can edit any row's date, amount and description before saving.

**Transaction state**

- Category source: `ai`, `user` (every saved transaction has a category, D-037).
- Context: `none`, `complete` (mood and motivation set; outcome and note optional, D-044).

**View state** (transaction list and charts): `loading`, `empty` (no data), `filtered-empty` (data exists but filters match nothing), `populated`, `error`.

### Journeys

#### J1. First visit with no data (User, Demo user)

```gherkin
Feature: First visit

  Scenario: Empty app offers a way in
    Given the database holds no transactions
    When I open the app
    Then I see the empty state, which is the Import page on "Choose source" (D-039)
    And in demo mode I see "Load demo data" and the sample files, otherwise the file picker
    And I do not see any charts

  Scenario: Demo user loads demo data
    Given the app is in the empty state
    When I choose "Load demo data"
    Then a copy of the demo transactions is stored for my visitor session only
    And I land on Insights, the first tab, in the populated state (to be refined)
    And the demo banner is visible

  Scenario: Returning visitor whose copy has expired
    Given I loaded demo data earlier and my copy has expired
    When I open the app
    Then I see the empty state again, not an error

  Scenario: Database unreachable on first visit
    Given the database cannot be reached
    When I open the app
    Then I see the error state with a retry action
    And I do not see the empty state, so I am not invited to import into a broken app
```

Edge cases:
- Demo load pressed twice quickly: second press is ignored while loading, no duplicate demo rows.
- Demo data already loaded in another tab (same cookie): loading again is a no-op, not a duplicate.
- Visitor blocks or clears cookies: they get a new, empty copy each time, and a fresh per-visitor limit. The global daily cap bounds the cost (D-032).
- Expired copies are cleaned up by a scheduled job so the database does not fill with abandoned data.

#### J2. Import a bank CSV (User)

```gherkin
Feature: Import bank CSV

  Scenario: Valid CSV
    Given I am on the import screen
    When I upload a CSV of 200 transactions
    Then the upload state moves through validating, extracting and reviewing
    And I see all 200 rows in review, each marked valid
    When I confirm
    Then the 200 transactions are saved as integer pence
    And I see a summary: 200 saved, 0 skipped

  Scenario: CSV with some bad rows
    Given a CSV where 3 rows have an unparseable date
    When I upload it
    Then those 3 rows are marked needs-fix in review
    And I can fix them inline or drop them
    And confirm is enabled once no row is needs-fix

  Scenario: Overlapping statement (duplicates)
    Given 100 of the transactions are already stored
    When I upload a CSV that includes them
    Then those rows are marked duplicate and skipped by default
    And the summary reports how many were skipped as duplicates

  Scenario: Identical purchases are counted, not collapsed
    Given the file has two identical rows on the same day with different running balances
    And one of them is already stored
    When I upload the file
    Then one row is marked duplicate and the other is treated as new

  Scenario: An edited transaction is not re-imported
    Given I corrected the amount of a stored transaction
    When I import the original statement again
    Then that row is marked duplicate, matched on its original imported values

  Scenario: Deployed demo accepts only sample files
    Given I am on the deployed demo
    Then I can only choose from the shipped sample files
    And I cannot upload my own file

  Scenario: Large import is reviewed by exception
    Given a CSV of 4,000 rows where 12 are duplicates and 5 have an unknown category
    When extraction finishes
    Then review shows a summary and only the 17 exception rows, not all 4,000
    And save stays disabled until the 5 unknown categories are picked or those rows are dropped
    And I can expand to all rows

  Scenario: Wrong file type (local or private environment)
    When I upload a file that is not CSV, PDF or an image
    Then the upload is rejected before extraction
    And I see the reason and the list of accepted types

  Scenario: Non-GBP rows
    Given a CSV containing a row in EUR
    When I upload it
    Then that row is marked needs-fix with the reason "GBP only"
    And it cannot be saved
```

Edge cases:
- Empty file, header-only file, or file with a different column layout: rejected with a specific message, not a generic error.
- Different delimiters, quoted commas in descriptions, BOM, UK date format (DD/MM/YYYY) vs ISO.
- Amounts like `1,234.56`, `-£5.00`, `(5.00)`; all must parse to the right integer pence, never via floating point.
- 5,000-row file: review list stays responsive (virtualised list); upload over 5,000 rows is rejected with the limit stated.
- File over 5 MB: rejected before extraction.
- Duplicate definition (D-011, revised by D-035): a row is a duplicate of a stored row when its date, amount and raw description match, plus the running balance when the file has one. A bank transaction ID is used as an extra only if a file has one; the expected RBS layout has none. Matching is by count: two identical rows in the file against one stored identical row gives one duplicate and one new row. Matching uses the original imported values, so edits do not cause re-imports. The user can always include a flagged duplicate in review.
- User closes the tab during review: nothing saved, no partial import.
- Save fails halfway: save is atomic (all rows or none) and the user sees `failed` with retry.
- Double-click on confirm: only one save happens.

#### J3. Import a PDF statement (User)

Scope: current account statements only (credit card and savings statements are later). One file per import; several months means repeating the import. (D-015, D-016)

```gherkin
Feature: Import bank PDF

  Scenario: Readable PDF statement
    When I upload a text-based PDF statement
    Then the AI extracts transactions
    And I see them in review with the same row states as a CSV

  Scenario: PDF that is not a bank statement
    When I upload a PDF of a menu
    Then extraction returns no valid transactions
    And I see "No transactions found" and nothing is saved

  Scenario: AI output fails validation
    Given the AI returns rows that do not match the schema
    When extraction completes
    Then invalid rows are marked needs-fix, never silently dropped or silently corrected
    And if the whole response is unusable I see the failed state with a retry action
```

Edge cases:
- Password-protected or corrupt PDF: rejected with a clear reason.
- Scanned PDF (image only): handled by the multimodal path or rejected, depending on ADR-001 open decision 10.
- More than 10 pages: rejected with the limit stated.
- AI timeout or rate limit from provider: `failed` with retry, no partial save.
- AI misreads or invents a transaction: mitigated by mandatory review and the optional balance check (D-013). v1 has no source references (page numbers or side-by-side view); the user accepts that risk for now. (D-017)
- Visitor over the hourly AI limit: upload blocked before any AI call, with a message saying when they can try again.

#### J4. Import a receipt photo (User)

```gherkin
Feature: Import receipt photo

  Scenario: Clear receipt
    When I upload a photo of a receipt
    Then the AI extracts merchant, date and total
    And I review a single proposed transaction
    When I confirm
    Then one transaction is saved

  Scenario: Receipt matches an existing bank transaction
    Given a stored transaction has the same date and total as the receipt
    When the receipt is extracted
    Then review shows a "possible duplicate" warning
    And I can still save the receipt as its own transaction

  Scenario: Unreadable photo
    When I upload a blurry photo
    Then extraction returns no total or marks the receipt unreadable
    And I am asked to retake the photo or discard it
    And there is no manual entry form
```

Edge cases:
- Receipt in a foreign currency: needs-fix, "GBP only".
- Multiple receipts in one photo, or a receipt cut off: treated as unreadable; the user decides.
- Receipt dated in the future or years ago: shown as a warning in review, not blocked. Future dates stay allowed with a warning for now (D-047).
- Total on the receipt differs from sum of line items: warning, the user picks the total.
- Line items are out of scope for v1; only the total is saved. A receipt is always its own transaction, never attached to a bank row (D-001). There is no manual entry (D-018), and the review shows no photo next to the proposed transaction (D-019).
- HEIC or very large photo: converted or rejected with a clear message.

#### J5. Review and confirm an import (User)

Applies to J2, J3 and J4.

**Review screen contents** (D-003, D-012, D-013)

- **Summary**: row count, date range, money in, money out, net, and counts per row state (valid, needs-fix, duplicate, unknown category).
- **Balance check (optional)**: opening and closing balance fields, prefilled when the file contains them. If they are filled in and opening balance plus net does not equal closing balance, a warning is shown. The user can still confirm.
- **Exceptions list** (the default view): `needs-fix` rows, `duplicate` rows and rows with an unknown category. Rows with a category are not listed.
- **Show all rows**: a virtualised list of every row, filterable by row state.
- **Editing**: any row's date, amount and description can be edited in the table, as click-to-edit cells validated on commit (D-034, ADR-001 open decision 18).
- **Bulk actions**: skip all duplicates, include all duplicates, drop selected rows.
- **Categories are assigned before review** (D-012). The AI must pick a category from the fixed list or answer "unknown" (D-020). A row with an unknown category is flagged "? Unknown category" and cannot be saved until the user picks a category in review or drops the row (D-037).
- **Saved screen**: after a successful save the Import page shows the "Saved" step with the number saved, the number skipped as duplicates, the number dropped and the date range, and a primary button "See your insights" (plus "View transactions" and "Import another"). (D-050)
- **Confirm button**: states what will be saved ("Save 3,812 transactions"). Disabled while any row is `needs-fix`, while any row has no category, or when there are zero valid rows, with the reason shown.

```gherkin
Feature: Review before saving

  Scenario: Nothing is saved without confirmation
    Given I am reviewing extracted rows
    When I leave the page without confirming
    Then nothing is saved

  Scenario: Balance mismatch warns but does not block
    Given I entered opening and closing balances
    When opening balance plus net does not equal closing balance
    Then I see a warning that rows may be missing or doubled
    And I can still confirm

  Scenario: needs-fix rows block confirm
    Given one row is needs-fix
    Then confirm is disabled and says why
    When I fix or drop that row
    Then confirm is enabled

  Scenario: A row with no category blocks confirm
    Given the AI answered "unknown" for 5 rows
    Then those rows show "? Unknown category"
    And confirm is disabled and says 5 rows have no category
    When I pick a category for each of them
    Then confirm is enabled

  Scenario: Drop a row
    When I remove a row from review
    Then it is not saved
    And it is counted as skipped in the summary

  Scenario: Saved screen
    Given I confirmed an import of 3,988 rows with 12 skipped duplicates
    Then I see the Saved step with "3,988 transactions saved" and "12 skipped as duplicates"
    And I can choose "See your insights", which opens Insights
    And I can choose "View transactions" or "Import another"

  Scenario: Cancel
    When I choose cancel
    Then the upload state becomes cancelled
    And I return to where I started with no data changed
```

Edge cases:
- Review contains zero valid rows: confirm is disabled and the reason is shown.
- Browser refresh during review: review is lost and the user starts again. Persisting drafts is recorded as ADR-001 open decision 17, because a real user is likely to feel this. (D-033)

#### J6. Categorise and override a category (User)

```gherkin
Feature: Categorisation

  Scenario: Auto-categorise on import
    Given I confirmed an import
    Then each saved transaction has a category with source "ai" or "user"

  Scenario: Unknown must be chosen before saving
    Given the AI answers "unknown" for a transaction
    Then it is listed in review as an exception with "? Unknown category"
    And it is not saved until I pick a category, and its source becomes "user"

  Scenario: Override a category
    Given a transaction categorised as "Groceries" by the AI
    When I change it to "Eating out"
    Then its category source becomes "user"
    And charts update
    And I see an undo option for a short time

  Scenario: Apply an override to the same merchant
    Given 5 other stored transactions share the merchant
    When I change one category
    Then I am offered "Apply to 5 other transactions from this merchant"
    When I accept
    Then all 6 take the new category with source "user"
    And one undo reverts all 6

  Scenario: Category must be from the allowed list
    When a category value outside the allowed list is submitted
    Then it is rejected and the category is unchanged

  Scenario: Re-import does not clobber my choice
    Given I overrode a category
    When I import an overlapping statement
    Then my category remains and the duplicate is skipped
```

Edge cases:
- Categories are a fixed list in v1 (no custom categories), including "Income" and "Transfers" (see Fixed lists; D-002, D-006, D-007, D-042). Custom categories are a later decision.
- An override applies to the stored transactions of the same merchant on request only. It is not remembered for future imports in v1. (D-021) "Same merchant" means the description with digits and reference numbers stripped, lower-cased and trimmed, matched exactly (D-022).
- Undo window: 10 seconds, held in the config file. (D-033)
- Two people change the same category at the same moment: last write wins; no locking in v1 without auth.
- Override on a transaction that was deleted in the other tab: clear "no longer exists" message, not a crash.

#### J7. Add context to a transaction (User)

```gherkin
Feature: Spending context

  Scenario: Add context to a purchase
    Given a stored transaction
    When I open it
    Then I can set how I felt, why I bought it and what happened with it, each from a fixed list, with an optional note
    And how I felt and why I bought it are required
    When I save
    Then its context state becomes complete

  Scenario: Mood and motivation are both required
    When I choose only the mood
    Then save is disabled and says why I bought it is needed too

  Scenario: Outcome and note are optional
    Given a transaction with mood and motivation
    Then I can save without an outcome or a note
    And I can add the outcome later

  Scenario: Context in the table
    Given a transaction with context
    Then the table shows a tag for each of mood, motivation and outcome that is set
    And a "View context" link opens a dialog with the values and the note

  Scenario: Clear context
    Given a transaction with context
    When I clear the context
    Then the whole context is removed
    And I see an undo option for a short time

  Scenario: Context too long
    When I enter more than 200 characters in the note
    Then I see the limit and cannot save until it is shortened
```

Edge cases:
- Context has three fields, each one value from a fixed list, plus one optional free-text note of at most 200 characters, so that behaviour charts have something to group by (D-002, D-023, D-045). The lists are in Fixed lists. Mood and motivation are required, because they are the "why" behind the buy (D-044).
- Context text containing markup or script: stored as plain text and rendered escaped.
- Context on an income or refund row: allowed.
- Missing context is never an error; the list shows a quiet "add context" prompt only.
- Deleting a transaction deletes its context (and its graph relationships).

#### J8. See where my money went (User, Demo user)

```gherkin
Feature: Charts

  Scenario: Monthly spending by category
    Given 12 months of transactions
    When I open the charts view
    Then I see spending by category for the current calendar month
    And I can switch month

  Scenario: Trend over 12 months
    Given 12 months of transactions
    Then I see spending per month for the last 12 months, stacked by category

  Scenario: Click through to transactions
    When I click a category slice or a bar segment
    Then the transaction list is filtered to those transactions

  Scenario: Behaviour view
    Given some transactions have context
    When I open the behaviour view
    Then I can pick mood, motivation or outcome and see spending grouped by it
    And transactions without that field appear as "No context"
    And I see how much spending has context, for example "18% of spending (£412 of £2,290) has context"
    And I am prompted to add context to the largest transactions without it

  Scenario: Add more context from the coverage measure
    Given the behaviour view shows "18% of spending has context"
    When I choose "Add more context"
    Then I go to the list of my biggest transactions without context
    And each has an "Add context" action

  Scenario: Filtered to nothing
    When I filter to a month with no transactions
    Then I see the filtered-empty state, not an empty chart

  Scenario: Performance at volume
    Given 5,000 transactions
    When I open the transaction list and charts
    Then the UI stays responsive
```

Edge cases:
- Refunds net against the category in which they occurred. (D-033)
- Every spending category has its own colour: eight hues in a fixed order, plus grey for Other, and a category keeps its colour in every chart. Labels, values and a table view are always present so colour is never the only signal (D-042).
- A month is a calendar month (D-025); pay-cycle months are a later option.
- A month with only income: spending chart is empty with an explanation.
- Very large single transaction (for example a mortgage payment) dominates the chart: a category filter lets the user hide that category from the view.
- Pence rounding: totals are sums of integers, formatted only at display.
- Timezone: transaction dates are calendar dates with no time, so no timezone shifting between months.

#### J9. Start the demo (Demo user)

Demo mode only; in user mode there is no demo button (D-009). The guided demo is one header button, not a checklist panel or overlays (D-049, which replaces D-027 and D-029).

```gherkin
Feature: Demo workflow

  Scenario: A first-time visitor is invited to start
    Given demo mode is on
    And I have no data yet
    When I open the app
    Then the header shows "Start import demo" instead of "Reset demo"
    When I choose "Start import demo"
    Then I go to Import, "Choose source"

  Scenario: The button becomes Reset once there is data
    Given I have loaded demo data or saved an import
    Then the header shows "Reset demo" and no longer shows "Start import demo"

  Scenario: Try a bad file
    Given I am on Import, "Choose source", in demo mode
    Then I can pick sample files: a CSV with bad rows, a wrong file type, an oversized file, and an unreadable receipt
    And each shows the correct rejected, needs-fix or failed state

  Scenario: Demo data shows incomplete records
    Given demo data is loaded
    Then some transactions have no context
    So I can see what the prompts to add context look like

  Scenario: No demo button in user mode
    Given demo mode is off
    Then neither "Start import demo" nor "Reset demo" is shown
```

Edge cases:
- Sample files are shipped with the app, so demo users never need their own.
- Demo user wants to try their own file: not possible in demo mode (D-004); the sample files cover the same states.
- Demo user hits the AI limit mid-tour: the sample runs through replay instead (stored AI result for that sample, labelled "Replayed result, not a live AI call"), so the walkthrough never dead-ends. (D-010)
- The guided demo does not simulate app-level failures such as the AI service failing or the database being unavailable. Those states exist in the app (see States) but are not demonstrated for now. (D-028)
- Stored transactions are always valid, because data is validated at every boundary (ADR-001). The "incomplete" demo rows are missing context, not invalid. Every stored row has a category (D-037).

#### J10. Reset demo data (Demo user)

Demo mode only. Reset is not offered in user mode, because it would delete real data (D-030).

```gherkin
Feature: Reset

  Scenario: Reset with confirmation
    Given I am in demo mode and I have data
    When I choose "Reset demo"
    Then I am asked to confirm and told that my demo data will be deleted
    When I confirm
    Then the app is in the resetting state and then on Import, "Choose source" (D-039)
    And in demo mode "Load demo data" is offered there
    And this is the same from Insights, Transactions and Import

  Scenario: Cancel reset
    When I cancel the confirmation
    Then nothing changes

  Scenario: Demo copy expires
    Given I have not used the app for 24 hours
    Then my demo copy is deleted
    And my next visit shows the empty state (Import, "Choose source")

  Scenario: Nothing to reset yet
    Given I have no data
    Then the header shows "Start import demo" instead of "Reset demo" (J9)

  Scenario: No reset in user mode
    Given demo mode is off
    Then "Reset demo" is not offered
```

Edge cases:
- Reset only affects my own visitor copy, so another visitor's data is never touched (D-005).
- Reset while an import of mine is in progress (two tabs): the import fails with a clear message rather than saving into a half-empty copy.
- Reset is not undoable. Undo is limited to category change, edits, and context clearing.
- The expiry window (24 hours of inactivity) lives in the config file.

#### J11. Two of us using the app (User, partner)

Deferred until auth exists (D-031). In v1, user mode runs locally on one machine with one dataset, and we share that machine or browser. Real data never goes on the deployed app, so cross-device access is not possible yet.

```gherkin
Feature: Shared use

  Scenario: One dataset on one machine
    Given user mode on my machine
    Then whoever opens the app on that machine sees the same transactions

  @after-auth
  Scenario: Both see the same data on our own devices
    Given I imported a statement
    When my partner opens the app on another device
    Then they see the same transactions

  @after-auth
  Scenario: Concurrent edits
    Given we both edit the same transaction
    Then the last save wins
    And the other person sees the updated value on next load
```

Edge cases (all after auth):
- No per-person ownership of transactions in v1; "whose spending is this" is an open question for the auth ADR.
- Joint vs individual accounts are not modelled in v1.

#### J12. Correct a stored transaction (User)

```gherkin
Feature: Correct a transaction

  Scenario: Fix a misread amount
    Given a stored transaction with amount £4.50 that should be £45.00
    When I edit the amount to 45.00
    Then the transaction shows £45.00 with an "edited" marker
    And charts and totals update
    And I see an undo option for 10 seconds

  Scenario: Invalid edit is rejected
    When I enter an amount that is not a valid number, or a date that does not exist
    Then I see the reason and the stored value is unchanged

  Scenario: Original values are kept
    Given I edited a transaction
    When I open its details
    Then I can see the original imported values

  Scenario: Editing does not break duplicate detection
    Given I edited a transaction
    When I re-import the statement it came from
    Then that row is flagged duplicate
```

Edge cases:
- An edit can move a transaction to another month; charts for both months update.
- Editing a date to the future is allowed with a warning, as in receipts (D-047). To be revisited: perhaps only scheduled direct debits should allow it.
- Changing an amount from negative to positive turns spending into income or a refund; the category is kept and the user is shown a warning.
- Two tabs editing the same transaction: last write wins (single machine in v1).
- Editing context or category uses the same table, so a transaction can be fixed in one pass.

### Decisions

Every decision made while writing this section is recorded in `SPEC-DECISIONS.md` (D-001 onwards) with the options, the recommendation and the answer. Architecture-level follow-ups are ADR-001 open decisions 11 to 16.

### Still open

Nothing blocking from the first design review. To refine as the screens are built: the empty-state flow and where "Load demo data" lands (D-039), and whether future dates should be limited to scheduled direct debits (D-047).

Follow-ups are ADR-001 open decisions 11 to 17.

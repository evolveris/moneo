# Screen fields (draft for validation)

What each screen reads and writes, drawn from the SPEC (D-002, D-006, D-022, D-023, D-034, D-035) and the design review decisions D-037 to D-048, and from the updated mockups. This is the input for the Zod schemas in slice 04. It now matches the SPEC; the author's answers are listed under "Answers" at the end.

Notation: `?` optional, `derived` computed in code and not stored, `system` set by the app, `user` entered or edited by the author. Money is integer pence, negative for spending.

## 1. The stored transaction

| Field | Type | Who sets it | Notes |
|---|---|---|---|
| `id` | string | system | Not a bank ID; cannot be relied on for duplicates (D-035) |
| `visitorId` | string | system | Demo mode: every query is scoped to it |
| `date` | calendar date (`YYYY-MM-DD`), no time | import, `user` | Must be a real date. Future dates: to be decided later (D-047, section 6) |
| `amountPence` | integer | import, `user` | Negative = spending, positive = income or refund. Never a float |
| `description` | string, non-empty | import, `user` | The raw bank text |
| `category` | one of 11 (section 2) | `ai`, `user` | Required: a row without one cannot be saved (D-037) |
| `categorySource` | `ai` or `user` | system | `uncategorised` is removed, because every saved row has a category |
| `merchantName` | string, optional | import | The clean merchant name. Receipts set it; CSV rows leave it empty for now (ADR-001 open decision 15) |
| `context` | object, optional | `user` | A transaction has either no context or a complete one. Shape below |
| `context.mood` | one of 8, **required** | `user` | Together with `motivation`, the "why" behind the buy |
| `context.motivation` | one of 9, **required** | `user` | See above |
| `context.outcome` | one of 6, optional | `user` | Often added later, after the purchase |
| `context.note` | string, max 200 characters, optional | `user` | Free text, one note per transaction. Limit lives in the config file |
| `original` | `{ date, amountPence, description }` | system | The imported values, kept for duplicate matching and the "edited" marker (D-034, D-035) |
| `importId` | string | system | Which import saved it |
| `sourceType` | `csv`, `pdf` or `receipt` | system | |
| `createdAt` | timestamp | system | |

**Derived, not stored:**
- `merchantKey`: description with digits and reference numbers stripped, lower-cased, trimmed (D-022). Used to group and for "apply to the same merchant".
- `edited`: true when date, amount or description differs from `original`.
- `contextState`: `complete` when `context` exists (so mood and motivation are both set; outcome and note are optional), otherwise `none`. There is no `partial` state (D-044).
- `kind`: `spending` (amount negative, category not Income or Transfers), `income`, `transfer`, `refund`. Decides what the spending charts include (D-006, D-033).

## 2. The lists (fixed in code)

- **Category (11, D-042):** Groceries, Eating out, Transport, Housing, Bills and utilities, Subscriptions, Shopping, Health and fitness, Other, Income, Transfers.
- **Mood (8):** happy, stressed, bored, sad, anxious, excited, calm, tired.
- **Motivation (9):** need, planned, habit, impulse, treat, social pressure, deal or sale, social media, unwell.
- **Outcome (6):** glad I bought it, regret it, used it, unused, returned, sold.

## 3. Screens

### Import: choose source

| Reads | Writes |
|---|---|
| Mode flag (demo or user), the list of shipped sample files (demo mode), the visitor's remaining AI uploads (`getLimits`) | A chosen sample file (demo) or an uploaded file (user): `fileName`, `fileType`, `sizeBytes` |

Validated before anything else: type (CSV, PDF, image), size (5 MB), PDF pages (10), rows (5,000).

### Import: review

| Reads | Writes |
|---|---|
| Review rows (below), summary, balance check | Edits to a row's `date`, `amountPence`, `description`, `category`; row actions skip, include or drop; opening and closing balance (optional); the confirm action |

**Review row** = the transaction fields (without `id`, `visitorId`, `importId`, `createdAt`) plus:
- `rowState`: `valid`, `needs-fix`, `duplicate`, or `dropped`.
- `runningBalance`: integer pence, optional. Only during review, used for duplicate matching (D-035); not stored.
- `problems`: list of reasons for `needs-fix`, for example "amount is not a number", "currency is not GBP", **"no category"**.
- `duplicateOf`: the matched stored transaction, when `duplicate`.
- `include`: for duplicates, whether the user chose to keep it.

**Summary** (derived): row count, date range, money in, money out, net, count per row state.

**Balance check** (optional): `openingBalancePence?`, `closingBalancePence?`. Warning when opening + net ≠ closing. Does not block.

**Confirm button:** "Save N transactions". Disabled when any row is `needs-fix` (this now includes a missing category), or when zero rows are valid, and shows the reason.

### Transactions

| Reads | Writes |
|---|---|
| Per row: `date`, `description`, `category`, `context` (mood, motivation, outcome, and whether a note exists), `amountPence`, `edited`. Filters: month, category, clicked chart segment | Click-to-edit cells: `date`, `description`, `category`, `amountPence`. Opens the context panel. Undo (10 seconds). "Apply to N other transactions from this merchant" |

Columns: Date, Description, Category, Context, Amount.
- **Context cell:** small tags for each of mood, motivation and outcome that is set (for example "happy", "impulse"), and a "View context" link to a dialog. When there is no context, an "Add context" prompt instead.
- **View context dialog (read only):** date, description, amount, category, mood, motivation, outcome, note, and an "Edit context" action that opens the context panel.
- **States:** loading, empty, filtered-empty, populated, error.

### Context panel (side panel)

| Reads | Writes |
|---|---|
| The transaction's `date`, `description`, `category`, `amountPence`, and current `context` | `context.mood` ("How I felt"), `context.motivation` ("Why I bought it"), `context.outcome` ("What happened"), `context.note`. Clearing the whole context, with undo |

Each of the three is a pick from its fixed list. **Mood and motivation are required to save; the Save button stays disabled until both are chosen.** Outcome is optional and can be added later. Note: free text, maximum 200 characters, validated on save.

### Insights (tab order: Behaviour, By category, 12-month trend)

| Reads | Writes |
|---|---|
| Spending transactions (negative amounts, not Income or Transfers, refunds netted); income per month as a separate total; context coverage | The chosen month; the chosen behaviour field (mood, motivation or outcome). Clicking a segment sets filters for the Transactions tab |

- **Behaviour:** for the chosen field, spending total and count per value, plus "No context". Coverage: "N% of spending (£x of £y) has context". The biggest spending transactions without context, each with "Add context".
- **By category:** for the chosen month, total and share per category, with a table view.
- **12-month trend:** for the last 12 calendar months, total per month stacked by category, with a table view.
- Chart colours: every category has its own colour (eight hues in a fixed order, grey for Other), with labels, values and a table view so colour is never the only signal (D-042).

### Header and app level

| Reads | Writes |
|---|---|
| Mode flag; app state (empty, populated, resetting, error); visitor cookie | "Reset demo" (demo mode only): confirms, wipes the visitor's copy, returns to Import on "Choose source" |

Persistent banner "Demo data only." in the deployed demo. "Project repo" link to GitHub.

## 4. Answers (author)

1. **Category required: yes (D-037).** `categorySource` is `ai | user`; `uncategorised` is removed.
2. **Note length: 200 characters, D-045 (author considered 200 or 140).** Reason: notes cost AI tokens when they are read for interpretation (D-036), and they could be added to many transactions at once. 200 characters is about 50 tokens, so 1,000 notes is about 50,000 tokens; 140 would be about 35 each. The limit is one value in the config file, so it can be lowered without code changes. Decided early on purpose.
3. **One note per transaction: yes.**
4. **Mood and motivation are required to save any context (D-044); outcome and note are optional.** In the author's words, this is "the why behind the buy, so the exact thing that will make the app valuable". A transaction therefore has no context or a complete one, and the `partial` context state goes away (D-033 listed `none`, `partial`, `complete`).
5. **Running balance: review only, not stored.**
6. **Merchant name: its own field (D-046),** optional and stored.
7. **Tags: show all three** (mood, motivation, outcome) for whichever are set.
8. **A positive amount in any category other than Income is a refund of that category: yes.**

## 5. Still open

Nothing open from the questions above.

## 6. To think about later

- **Future dates.** The draft allowed a future date with a warning (SPEC J4 receipts, J12 edits). The author's view: probably allow it only for direct debits and standing orders that are scheduled, and treat other future dates as a problem. Not decided; revisit when import and editing are built.

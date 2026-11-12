# Slice 04: Domain core

- Status: in review
- Journeys: shared rules (no screen)
- Depends on: slice 03a (merged), slice 03 (Vitest and Zod installed)
- Branch / PR: `slice-04-domain-core` / filled in when opened

## Goal

After this slice the developer has one tested place for the rules every later slice relies on: money as integer pence, the fixed lists, the Zod schemas for a transaction and an import review, the derived values, the limits and the demo or user mode. There is nothing to see in the browser. Later slices import these instead of making up their own.

## Scenarios covered

None are made to pass end to end, because nothing has a screen yet. The slice implements these SPEC "Shared rules" so the scenarios in J2 to J10 have something to stand on:

- Money is GBP only, integer pence, never a float. A row in another currency is rejected with a reason.
- Spending is negative; income and refunds are positive; kinds decide what the charts include (D-006, D-033).
- Every saved transaction has a category (D-037).
- Context is mood and motivation together, plus optional outcome and a note of at most 200 characters; no partial context (D-044, D-045).
- Edits are validated: amount as integer pence, date as a real date (D-034).
- Limits in one config file with a per-visitor override through `getLimits(visitorId)` (D-008).
- Demo mode is a flag read in one place (D-009).

## In scope

Everything is pure TypeScript in `src/` with no React and no database. File layout is a proposal; it follows `src/lib/env.ts` and `env.test.ts` (test next to the file).

- **Money** (`src/domain/money.ts`): a `Pence` type (branded integer), `toPence` guard that rejects non-integers and unsafe integers, `parsePounds("12.34" | "-£1,200.50" | "(5.00)")` to pence using string handling only, `formatPence(-1234)` to `-£12.34`.
- **Fixed lists** (`src/domain/lists.ts`): `CATEGORIES` (11), `MOODS` (8), `MOTIVATIONS` (9), `OUTCOMES` (6) as `as const` arrays, with Zod enums built from them. Values and order exactly as in SPEC "Fixed lists". The chart colour per category stays in the UI slice that draws charts, not here.
- **Zod schemas** (`src/domain/schemas.ts`):
  - `Transaction`: `date` as a real calendar date string `YYYY-MM-DD` (rejects `2026-02-30`), `amountPence` integer, non-empty `description`, `category`, `categorySource` (`ai | user`), optional `merchantName`, optional `context`, `original`, `importId`, `sourceType` (`csv | pdf | receipt`), plus `id`, `visitorId`, `createdAt`.
  - `Context`: required `mood` and `motivation`, optional `outcome`, optional `note` of at most the configured length.
  - `ReviewRow`: the transaction fields minus `id`, `visitorId`, `importId`, `createdAt`, plus `rowState` (`valid | needs-fix | duplicate | dropped`), `problems`, `duplicateOf`, `include`, optional `runningBalance`.
  - `ImportSummary` and `BalanceCheck` (optional opening and closing balance in pence).
  - Types exported with `z.infer`, so there is one definition.
- **Derived values** (`src/domain/derived.ts`), each a pure function: `merchantKey`, `edited`, `contextState` (`none | complete`), `kind` (`spending | income | transfer | refund`). Also `summarise(rows)` and `checkBalance(opening, closing, net)` for the summary and balance check in the screen fields, since slice 07 needs them and they are pure. (Say if you would rather leave these two to slice 07.)
- **Limits** (`src/config/limits.ts` and `src/domain/limits.ts`): one config file with note length 200, undo window 10 s, file size 5 MB, PDF pages 10, rows 5,000, AI uploads per visitor per hour 5. `getLimits(visitorId)` returns the defaults merged with an override read from an environment variable (JSON keyed by visitor ID), validated with Zod. A malformed variable fails loudly with the variable name and never its contents. The global daily AI cap is not included (see out of scope).
- **Mode flag** (`src/domain/appMode.ts`): `getAppMode()` returns `"demo"` or `"user"`, read from one environment variable in one place, validated with Zod.
- `.env.example` and the README environment section gain the two new variables.

## Out of scope

- Neo4j data model and any query (separate ADR before slice 05).
- Any UI, route, or cookie. The visitor ID is just a string argument here.
- The `extract` interface (slice 08), and the global daily AI cap and per-visitor hourly counting (slice 15; this slice only holds the numbers).
- Duplicate detection, the CSV parser, category colours, future-date warnings (D-047 stays a later decision; the schema accepts any real date).
- Guarding demo-only or user-only code paths. There are none yet; the single read point is what makes that possible later.

## Files likely to change

- New: `src/domain/{money,lists,schemas,derived,limits,mode}.ts` and a `.test.ts` beside each.
- New: `src/config/limits.ts`.
- Edited: `.env.example`, `README.md` (environment variables).
- No change to existing app code.

## How it will be tested

- Vitest unit tests for:
  - Money: parse and format round trips; `0.1 + 0.2` style cases are exact; rejects `1.234`, `NaN`, `Infinity`, `1e21`, floats passed to `toPence`; negative and bracketed forms; large values.
  - Lists: exact contents and order, and that schemas reject anything outside them.
  - Schemas: a valid transaction passes; fails for a fake date, float amount, empty description, missing category, context with only mood, note of 201 characters (and 200 passes), unknown `sourceType`. Review row states.
  - Derived: `merchantKey` (digits and references stripped, case and whitespace), `edited` for each of the three fields, `contextState`, `kind` for each case including refunds in a non-Income category.
  - Limits: defaults, override for one visitor only, override that sets a single field, malformed JSON, wrong types.
  - Mode: each valid value, missing and invalid values.
- Manual check: `npm run check` passes (types, lint, format, tests). `npm run build` passes. No browser check, because no screen or build output changes.
- Not tested: behaviour on Vercel with real environment variables.

## Open questions

These need your answer before code starts. Each has a recommendation.

1. **Mode flag: variable name, default and name of the unset case (ADR-001 open decision 16).** The slice index says an environment variable is enough to start. Recommendation: `APP_MODE=demo|user`, server-only (no `NEXT_PUBLIC_`), and **when unset or invalid it is `demo`**, so the public deployment can never fall into user mode by forgetting a variable. Local private use sets `APP_MODE=user`. Does this settle open decision 16 for now, with the managed flag service left for later?
2. **Override variable name.** Recommendation: `MONEO_LIMIT_OVERRIDES='{"visitor-id":{"maxRows":100}}'`.
3. **Zero amounts and signs.** SPEC says spending is negative and income positive but not what to do with: (a) `amountPence` of 0; (b) a negative amount categorised as Income; (c) a positive amount categorised as Transfers. Recommendation: (a) rejected as a problem ("amount is zero"); (b) kind `spending` is wrong and so is `income`, so the schema rejects it as a `needs-fix` problem; (c) kind `transfer` (Transfers wins in both directions, as a transfer can go either way). Do you agree, or should some of these be allowed?
4. **`merchantKey` detail.** D-022 says digits and references stripped. Recommendation: remove every run of digits and any token that mixes letters and digits of 6+ characters or looks like a reference, collapse whitespace, lower-case, trim; punctuation is kept. So "TESCO STORES 3214 LONDON" becomes "tesco stores london". Fine for a first version, to be tuned with real sample data in slice 09?
5. **Folder name.** The SPEC suggests `src/config/limits.ts`; existing code is in `src/lib`. Recommendation: config in `src/config/limits.ts` as the SPEC says, domain code in `src/domain/` so it is easy to see what has no React or database in it. Or put everything in `src/lib`?
6. **`summarise` and `checkBalance` now or in slice 07?** Recommendation: now, they are pure and the schemas for their output are part of this slice.

## Decisions made during the slice

Answers to the open questions (author):

1. Mode flag is `APP_MODE=demo|user`, server-only, defaulting to `demo` when missing or invalid. This settles ADR-001 open decision 16 for now (environment variable); a managed flag service stays possible later.
2. Overrides come from `USER_LIMIT_OVERRIDES`.
3. Zero amounts are a problem; negative Income is a problem; Transfers is a transfer in both directions.
4. `merchantKey` removes only words that are nothing but digits, so `T5SCO` keeps its 5. Mixed letter and digit words stay.
5. Config in `src/config/limits.ts`, domain code in `src/domain/`.
6. `summarise` and `checkBalance` are in this slice.

Choices made while building (not in the plan):

- A review row allows `null` for `date`, `amountPence` and `category`, because a row that needs fixing may lack them; the reasons are in `problems`. `rowProblems` is a small pure function that lists those reasons.
- `summarise`: `rowCount` and `counts` cover every row; money totals and the date range cover only rows that would be saved (valid, or a duplicate the user chose to keep).
- `getMode` and `getLimits` take an optional `env` argument (default `process.env`) so tests need no global state, as `parseNeo4jEnv` does.
- The note limit in the schema is the default (200). A per-visitor `noteMaxLength` override is returned by `getLimits` but the schema does not read it; the UI slices decide where to use it.

Changed after review comments on the pull request (author):

- A zero amount is allowed. Empty rows do appear in bank CSV files and change nothing. This reverses answer 3 above for zero only; negative Income is still rejected.
- Renames: `kind` is `getTransactionKind`, `rowProblems` is `rowProblemList`, `getMode` is `getAppMode`, `checkAmount` is `rejectNegativeIncome`, the description schema is `transactionDescription`.
- Review row `problems` is a list of codes from an enum (`ProblemSchema`) and not free text, so the screens can write the message. A row in the `valid` state with no date, amount or category is rejected.
- `contextState` takes only a valid `Context`, which is always complete, so it returns `none` or `complete`. A context with only a mood or only a motivation is rejected by `ContextSchema` (tested there), not handled in `contextState`.
- A zero amount has its own transaction kind, `zero`, so it is left out of spending, income, transfer and refund totals and counts.
- `parsePounds` returns `{ ok: true, pence }` or `{ ok: false, reason }` with the reason `not-a-number`, `too-many-decimals` or `too-large`, so the CSV parser can say why a cell was rejected.

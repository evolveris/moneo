import { toPence, type Pence } from "./money"
import type {
  BalanceCheck,
  Context,
  ImportSummary,
  Problem,
  ReviewRow,
  Transaction,
} from "./schemas"

export type Kind = "spending" | "income" | "transfer" | "refund"

// Digits and references stripped, lower-cased, trimmed (D-022). Only a word
// that is nothing but digits is removed, so "T5SCO" keeps its 5.
export function merchantKey(description: string): string {
  return description
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (word) => word !== "" && !/^[^\p{L}\p{N}]*\d+[^\p{L}\p{N}]*$/u.test(word),
    )
    .join(" ")
}

export function edited(
  tx: Pick<Transaction, "date" | "amountPence" | "description" | "original">,
): boolean {
  return (
    tx.date !== tx.original.date ||
    tx.amountPence !== tx.original.amountPence ||
    tx.description !== tx.original.description
  )
}

// Complete means mood and motivation are both set (D-044). There is no partial
// state: a context with only one of them is not complete, so it counts as none.
// (The schema rejects such a context, so it cannot be stored.)
export function contextState(tx: {
  context?: Partial<Context>
}): "none" | "complete" {
  return tx.context?.mood && tx.context.motivation ? "complete" : "none"
}

// Decides what the spending charts include (D-006, D-033). A positive amount
// in any category other than Income is a refund of that category.
export function getTransactionKind(
  tx: Pick<Transaction, "amountPence" | "category">,
): Kind {
  if (tx.category === "Transfers") return "transfer"
  if (tx.amountPence > 0) return tx.category === "Income" ? "income" : "refund"
  return "spending"
}

// The reasons a review row cannot be saved yet, as a list (empty when none).
export function rowProblemList(
  row: Pick<ReviewRow, "date" | "amountPence" | "description" | "category">,
): Problem[] {
  const problems: Problem[] = []
  if (row.date === null) problems.push("invalid-date")
  if (row.amountPence === null) problems.push("invalid-amount")
  else if (row.category === "Income" && row.amountPence < 0)
    problems.push("negative-income")
  if (row.description.trim() === "") problems.push("empty-description")
  if (row.category === null) problems.push("no-category")
  return problems
}

// Rows with a state that will be saved: valid, or a duplicate the user chose
// to keep. Totals count only those; `rowCount` and `counts` count every row.
function willSave(row: ReviewRow): boolean {
  return (
    row.rowState === "valid" ||
    (row.rowState === "duplicate" && row.include === true)
  )
}

export function summarise(rows: ReviewRow[]): ImportSummary {
  const counts = { valid: 0, "needs-fix": 0, duplicate: 0, dropped: 0 }
  let moneyIn = 0
  let moneyOut = 0
  let from: string | null = null
  let to: string | null = null
  for (const row of rows) {
    counts[row.rowState] += 1
    if (!willSave(row)) continue
    if (row.amountPence !== null) {
      if (row.amountPence > 0) moneyIn += row.amountPence
      else moneyOut += row.amountPence
    }
    if (row.date !== null) {
      if (from === null || row.date < from) from = row.date
      if (to === null || row.date > to) to = row.date
    }
  }
  return {
    rowCount: rows.length,
    dateRange: from !== null && to !== null ? { from, to } : null,
    moneyInPence: toPence(moneyIn),
    moneyOutPence: toPence(moneyOut),
    netPence: toPence(moneyIn + moneyOut),
    counts,
  }
}

// A warning only; it never blocks saving.
export function checkBalance(
  opening: Pence | undefined,
  closing: Pence | undefined,
  netPence: Pence,
): BalanceCheck {
  if (opening === undefined || closing === undefined) {
    return { status: "not-given" }
  }
  const expected = toPence(opening + netPence)
  if (expected === closing) return { status: "ok" }
  return {
    status: "mismatch",
    expectedClosingPence: expected,
    differencePence: toPence(closing - expected),
  }
}

import { describe, expect, it } from "vitest"
import {
  checkBalance,
  contextState,
  edited,
  getTransactionKind,
  merchantKey,
  rowProblemList,
  summarise,
} from "./derived"
import { toPence } from "./money"
import type { ReviewRow } from "./schemas"

describe("merchantKey", () => {
  it.each([
    ["TESCO STORES 3214 LONDON", "tesco stores london"],
    ["  Tesco   Stores  ", "tesco stores"],
    ["T5SCO 123", "t5sco"],
    ["AMZN MKTP UK*2K4 99", "amzn mktp uk*2k4"],
    ["PRET #4567 LONDON", "pret london"],
    ["SHOP 3214, LONDON", "shop london"],
    ["12345", ""],
  ])("turns %j into %j", (input, key) => {
    expect(merchantKey(input)).toBe(key)
  })

  // merchantKey is how "apply to the same merchant" finds matching
  // transactions, so the same shop with a different branch or reference number
  // must give the same key.
  it("gives the same key for one merchant with different reference numbers", () => {
    expect(merchantKey("TESCO 1111")).toBe(merchantKey("tesco 2222"))
  })
})

describe("edited", () => {
  const imported = {
    date: "2026-03-31",
    amountPence: toPence(-1250),
    description: "TESCO STORES 3214",
  }
  const transaction = { ...imported, original: imported }

  it("is false when nothing changed", () => {
    expect(edited(transaction)).toBe(false)
  })

  it("is true when the date was changed", () => {
    expect(edited({ ...transaction, date: "2026-03-30" })).toBe(true)
  })

  it("is true when the amount was changed", () => {
    expect(edited({ ...transaction, amountPence: toPence(-1520) })).toBe(true)
  })

  it("is true when the description was changed", () => {
    expect(edited({ ...transaction, description: "Tesco, weekly shop" })).toBe(
      true,
    )
  })
})

describe("contextState", () => {
  it("is none when there is no context", () => {
    expect(contextState({})).toBe("none")
  })

  it("is complete when mood and motivation are both set", () => {
    expect(
      contextState({ context: { mood: "happy", motivation: "need" } }),
    ).toBe("complete")
  })

  it("is not complete with a mood but no motivation", () => {
    expect(contextState({ context: { mood: "happy" } })).toBe("none")
  })

  it("is not complete with a motivation but no mood", () => {
    expect(contextState({ context: { motivation: "need" } })).toBe("none")
  })
})

describe("getTransactionKind", () => {
  it.each([
    [-100, "Groceries", "spending"],
    [-100, "Other", "spending"],
    [100, "Income", "income"],
    [100, "Groceries", "refund"],
    [-100, "Transfers", "transfer"],
    [100, "Transfers", "transfer"],
  ] as const)("%i in %s is %s", (amount, category, expected) => {
    expect(getTransactionKind({ amountPence: toPence(amount), category })).toBe(
      expected,
    )
  })
})

describe("rowProblemList", () => {
  const ok = {
    date: "2026-03-31",
    amountPence: toPence(-100),
    description: "A",
    category: "Groceries" as const,
  }

  it("is empty for a good row", () => {
    expect(rowProblemList(ok)).toEqual([])
  })

  it("accepts a zero amount", () => {
    expect(rowProblemList({ ...ok, amountPence: toPence(0) })).toEqual([])
  })

  it.each([
    ["no category", { category: null }, "no-category"],
    ["no date", { date: null }, "invalid-date"],
    ["no amount", { amountPence: null }, "invalid-amount"],
    ["a blank description", { description: " " }, "empty-description"],
    [
      "negative income",
      { category: "Income" as const, amountPence: toPence(-5) },
      "negative-income",
    ],
  ])("reports %s", (_name, patch, problem) => {
    expect(rowProblemList({ ...ok, ...patch })).toEqual([problem])
  })

  it("reports every problem a row has", () => {
    expect(
      rowProblemList({ ...ok, date: null, category: null, description: "" }),
    ).toEqual(["invalid-date", "empty-description", "no-category"])
  })
})

const row = (patch: Partial<ReviewRow>): ReviewRow => ({
  date: "2026-03-10",
  amountPence: toPence(-1000),
  description: "X",
  category: "Other",
  sourceType: "csv",
  rowState: "valid",
  problems: [],
  ...patch,
})

describe("summarise", () => {
  it("returns zero totals and no date range for an import with no rows", () => {
    expect(summarise([])).toEqual({
      rowCount: 0,
      dateRange: null,
      moneyInPence: 0,
      moneyOutPence: 0,
      netPence: 0,
      counts: { valid: 0, "needs-fix": 0, duplicate: 0, dropped: 0 },
    })
  })

  it("totals only rows that will be saved, and counts every row", () => {
    const summary = summarise([
      row({ date: "2026-03-10", amountPence: toPence(-1000) }),
      row({
        date: "2026-03-02",
        amountPence: toPence(250000),
        category: "Income",
      }),
      row({
        date: "2026-03-20",
        amountPence: toPence(-500),
        rowState: "duplicate",
      }),
      row({
        date: "2026-03-25",
        amountPence: toPence(-700),
        rowState: "duplicate",
        include: true,
      }),
      row({
        date: "2026-01-01",
        amountPence: toPence(-9),
        rowState: "dropped",
      }),
      row({ date: null, amountPence: null, rowState: "needs-fix" }),
    ])
    expect(summary).toEqual({
      rowCount: 6,
      dateRange: { from: "2026-03-02", to: "2026-03-25" },
      moneyInPence: 250000,
      moneyOutPence: -1700,
      netPence: 248300,
      counts: { valid: 2, "needs-fix": 1, duplicate: 2, dropped: 1 },
    })
  })
})

describe("checkBalance", () => {
  it("is not-given unless both balances are given", () => {
    expect(checkBalance(undefined, toPence(100), toPence(0))).toEqual({
      status: "not-given",
    })
    expect(checkBalance(toPence(100), undefined, toPence(0))).toEqual({
      status: "not-given",
    })
  })

  it("is ok when opening plus net equals closing", () => {
    expect(checkBalance(toPence(10000), toPence(8500), toPence(-1500))).toEqual(
      { status: "ok" },
    )
  })

  it("reports the difference when it does not", () => {
    expect(checkBalance(toPence(10000), toPence(8000), toPence(-1500))).toEqual(
      {
        status: "mismatch",
        expectedClosingPence: 8500,
        differencePence: -500,
      },
    )
  })
})

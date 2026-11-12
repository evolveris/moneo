import { describe, expect, it } from "vitest"
import {
  checkBalance,
  contextState,
  edited,
  kind,
  merchantKey,
  rowProblems,
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

  it("groups the same merchant with different references", () => {
    expect(merchantKey("TESCO 1111")).toBe(merchantKey("tesco 2222"))
  })
})

describe("edited", () => {
  const tx = {
    date: "2026-03-31",
    amountPence: toPence(-100),
    description: "A",
    original: {
      date: "2026-03-31",
      amountPence: toPence(-100),
      description: "A",
    },
  }

  it("is false when nothing changed", () => {
    expect(edited(tx)).toBe(false)
  })

  it.each([
    ["date", { date: "2026-03-30" }],
    ["amount", { amountPence: toPence(-200) }],
    ["description", { description: "B" }],
  ])("is true when the %s changed", (_name, patch) => {
    expect(edited({ ...tx, ...patch })).toBe(true)
  })
})

describe("contextState", () => {
  it("is none without context and complete with it", () => {
    expect(contextState({})).toBe("none")
    expect(
      contextState({ context: { mood: "happy", motivation: "need" } }),
    ).toBe("complete")
  })
})

describe("kind", () => {
  it.each([
    [-100, "Groceries", "spending"],
    [-100, "Other", "spending"],
    [100, "Income", "income"],
    [100, "Groceries", "refund"],
    [-100, "Transfers", "transfer"],
    [100, "Transfers", "transfer"],
  ] as const)("%i in %s is %s", (amount, category, expected) => {
    expect(kind({ amountPence: toPence(amount), category })).toBe(expected)
  })
})

describe("rowProblems", () => {
  const ok = {
    date: "2026-03-31",
    amountPence: toPence(-100),
    description: "A",
    category: "Groceries" as const,
  }

  it("has none for a good row", () => {
    expect(rowProblems(ok)).toEqual([])
  })

  it("names each problem", () => {
    expect(rowProblems({ ...ok, category: null })).toEqual(["no category"])
    expect(rowProblems({ ...ok, date: null })).toEqual([
      "date is not a real date",
    ])
    expect(rowProblems({ ...ok, amountPence: null })).toEqual([
      "amount is not a number",
    ])
    expect(rowProblems({ ...ok, amountPence: toPence(0) })).toEqual([
      "amount is zero",
    ])
    expect(rowProblems({ ...ok, description: " " })).toEqual([
      "description is empty",
    ])
    expect(
      rowProblems({ ...ok, category: "Income", amountPence: toPence(-5) }),
    ).toEqual(["income cannot be negative"])
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
  it("is empty for no rows", () => {
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

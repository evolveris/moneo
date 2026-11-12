import { describe, expect, it } from "vitest"
import {
  BalanceCheckSchema,
  ContextSchema,
  DateSchema,
  ImportSummarySchema,
  ReviewRowSchema,
  TransactionSchema,
} from "./schemas"

const valid = {
  id: "t1",
  visitorId: "v1",
  date: "2026-03-31",
  amountPence: -1250,
  description: "TESCO STORES 3214",
  category: "Groceries",
  categorySource: "ai",
  original: {
    date: "2026-03-31",
    amountPence: -1250,
    description: "TESCO STORES 3214",
  },
  importId: "i1",
  sourceType: "csv",
  createdAt: "2026-04-01T09:00:00.000Z",
}

const fails = (patch: Record<string, unknown>) =>
  TransactionSchema.safeParse({ ...valid, ...patch }).success === false

describe("DateSchema", () => {
  it.each(["2026-03-31", "2024-02-29", "2026-12-31"])("accepts %s", (d) => {
    expect(DateSchema.safeParse(d).success).toBe(true)
  })

  it.each(["2026-02-30", "2025-02-29", "2026-13-01", "31/03/2026", "2026-3-1"])(
    "rejects %s",
    (d) => {
      expect(DateSchema.safeParse(d).success).toBe(false)
    },
  )
})

describe("TransactionSchema", () => {
  it("accepts a valid transaction", () => {
    expect(TransactionSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts optional merchantName and a complete context", () => {
    const result = TransactionSchema.safeParse({
      ...valid,
      merchantName: "Tesco",
      context: { mood: "happy", motivation: "need" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects a fake date", () => {
    expect(fails({ date: "2026-02-30" })).toBe(true)
  })

  it("rejects a float amount", () => {
    expect(fails({ amountPence: 12.5 })).toBe(true)
  })

  it("accepts a zero amount, as empty rows do appear in bank CSV files", () => {
    expect(fails({ amountPence: 0 })).toBe(false)
  })

  it("rejects an empty or blank description", () => {
    expect(fails({ description: "" })).toBe(true)
    expect(fails({ description: "   " })).toBe(true)
  })

  it("rejects a missing or unknown category", () => {
    expect(fails({ category: undefined })).toBe(true)
    expect(fails({ category: "Holidays" })).toBe(true)
  })

  it("rejects the removed 'uncategorised' category source", () => {
    expect(fails({ categorySource: "uncategorised" })).toBe(true)
  })

  it("rejects an unknown sourceType", () => {
    expect(fails({ sourceType: "xlsx" })).toBe(true)
  })

  it("rejects negative Income but accepts positive Income", () => {
    expect(fails({ category: "Income", amountPence: -100 })).toBe(true)
    expect(fails({ category: "Income", amountPence: 100 })).toBe(false)
  })

  it("accepts a positive amount in another category (a refund)", () => {
    expect(fails({ amountPence: 500 })).toBe(false)
  })
})

describe("ContextSchema", () => {
  it("needs mood and motivation together", () => {
    expect(ContextSchema.safeParse({ mood: "happy" }).success).toBe(false)
    expect(ContextSchema.safeParse({ motivation: "need" }).success).toBe(false)
    expect(
      ContextSchema.safeParse({ mood: "happy", motivation: "need" }).success,
    ).toBe(true)
  })

  it("keeps outcome optional and checks it against the list", () => {
    const base = { mood: "calm", motivation: "planned" }
    expect(
      ContextSchema.safeParse({ ...base, outcome: "used it" }).success,
    ).toBe(true)
    expect(ContextSchema.safeParse({ ...base, outcome: "meh" }).success).toBe(
      false,
    )
  })

  it("allows a note of 200 characters and not 201", () => {
    const base = { mood: "calm", motivation: "planned" }
    expect(
      ContextSchema.safeParse({ ...base, note: "a".repeat(200) }).success,
    ).toBe(true)
    expect(
      ContextSchema.safeParse({ ...base, note: "a".repeat(201) }).success,
    ).toBe(false)
  })
})

describe("ReviewRowSchema", () => {
  const row = {
    date: "2026-03-31",
    amountPence: -1250,
    description: "TESCO",
    category: "Groceries",
    sourceType: "csv",
    rowState: "valid",
    problems: [],
  }

  it.each(["valid", "needs-fix", "duplicate", "dropped"])(
    "accepts a complete row in the %s state",
    (rowState) => {
      expect(ReviewRowSchema.safeParse({ ...row, rowState }).success).toBe(true)
    },
  )

  it("accepts a needs-fix row with a null date, amount and category", () => {
    const result = ReviewRowSchema.safeParse({
      ...row,
      date: null,
      amountPence: null,
      category: null,
      rowState: "needs-fix",
      problems: ["invalid-date", "invalid-amount", "no-category"],
    })
    expect(result.success).toBe(true)
  })

  it.each([
    ["date", { date: null }],
    ["amount", { amountPence: null }],
    ["category", { category: null }],
  ])("rejects a valid row with no %s", (_name, patch) => {
    expect(ReviewRowSchema.safeParse({ ...row, ...patch }).success).toBe(false)
  })

  it("rejects a problem that is not in the list of problems", () => {
    const result = ReviewRowSchema.safeParse({
      ...row,
      rowState: "needs-fix",
      problems: ["something odd"],
    })
    expect(result.success).toBe(false)
  })

  it("rejects an unknown rowState and a float running balance", () => {
    expect(ReviewRowSchema.safeParse({ ...row, rowState: "ok" }).success).toBe(
      false,
    )
    expect(
      ReviewRowSchema.safeParse({ ...row, runningBalance: 1.5 }).success,
    ).toBe(false)
  })
})

describe("summary and balance schemas", () => {
  it("accept their own shapes", () => {
    expect(
      ImportSummarySchema.safeParse({
        rowCount: 0,
        dateRange: null,
        moneyInPence: 0,
        moneyOutPence: 0,
        netPence: 0,
        counts: { valid: 0, "needs-fix": 0, duplicate: 0, dropped: 0 },
      }).success,
    ).toBe(true)
    expect(BalanceCheckSchema.safeParse({ status: "ok" }).success).toBe(true)
    expect(BalanceCheckSchema.safeParse({ status: "mismatch" }).success).toBe(
      false,
    )
  })
})

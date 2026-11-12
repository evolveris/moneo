import { describe, expect, it } from "vitest"
import { formatPence, parsePounds, toPence } from "./money"

describe("toPence", () => {
  it("accepts whole numbers", () => {
    expect(toPence(1234)).toBe(1234)
    expect(toPence(-5)).toBe(-5)
  })

  it("never returns negative zero", () => {
    expect(Object.is(toPence(-0), 0)).toBe(true)
  })

  it.each([1.5, NaN, Infinity, 1e21])("rejects %s", (value) => {
    expect(() => toPence(value)).toThrow()
  })
})

describe("parsePounds", () => {
  const pence = (text: string) => {
    const result = parsePounds(text)
    return result.ok ? result.pence : result.reason
  }

  it.each([
    ["12.34", 1234],
    ["12", 1200],
    ["£5.5", 550],
    ["-£1,200.50", -120050],
    ["+5", 500],
    ["(5.00)", -500],
    ["0.1", 10],
    ["0.07", 7],
    ["1,234,567.89", 123456789],
  ])("reads %s as %i pence", (text, expected) => {
    expect(pence(text)).toBe(expected)
  })

  it("gives exact pence for amounts that floating point gets wrong", () => {
    expect(pence("0.29")).toBe(29)
    expect(pence("1.15")).toBe(115)
  })

  it("returns 0 for -0.00, not negative zero", () => {
    expect(Object.is(pence("-0.00"), 0)).toBe(true)
  })

  it.each(["", "abc", "1,23", "12.", ".5", "1e5", "NaN", "$5", "--5"])(
    "says %j is not a number",
    (text) => {
      expect(parsePounds(text)).toEqual({ ok: false, reason: "not-a-number" })
    },
  )

  it.each(["1.234", "0.001", "12.3456"])(
    "says %j has too many decimals",
    (text) => {
      expect(parsePounds(text)).toEqual({
        ok: false,
        reason: "too-many-decimals",
      })
    },
  )

  // Pence must stay a safe integer (at most 2^53 - 1 = 9,007,199,254,740,991
  // pence, about £90 trillion), or the arithmetic stops being exact.
  it("accepts the largest amount that is exact", () => {
    expect(pence("90,071,992,547,409.91")).toBe(Number.MAX_SAFE_INTEGER)
    expect(pence("-90,071,992,547,409.91")).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it.each(["90,071,992,547,409.92", "99999999999999999999"])(
    "says %j is too large to be exact",
    (text) => {
      expect(parsePounds(text)).toEqual({ ok: false, reason: "too-large" })
    },
  )
})

describe("formatPence", () => {
  it.each([
    [-1234, "-£12.34"],
    [5, "£0.05"],
    [0, "£0.00"],
    [120050, "£1,200.50"],
    [-100000000, "-£1,000,000.00"],
  ])("formats %i as %s", (pence, text) => {
    expect(formatPence(pence)).toBe(text)
  })

  it("is undone by parsePounds: formatting then parsing gives the same pence", () => {
    for (const pence of [0, 1, 99, 100, -12345, 98765432]) {
      expect(parsePounds(formatPence(pence))).toEqual({ ok: true, pence })
    }
  })
})

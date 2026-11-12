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
  ])("reads %s as %i pence", (text, pence) => {
    expect(parsePounds(text)).toBe(pence)
  })

  it("gives exact pence for amounts that floating point gets wrong", () => {
    expect(parsePounds("0.29")).toBe(29)
    expect(parsePounds("1.15")).toBe(115)
  })

  it("returns 0 for -0.00, not negative zero", () => {
    expect(Object.is(parsePounds("-0.00"), 0)).toBe(true)
  })

  it.each(["", "abc", "1.234", "1,23", "12.", ".5", "1e5", "NaN", "$5", "--5"])(
    "rejects %j",
    (text) => {
      expect(parsePounds(text)).toBeNull()
    },
  )

  // Pence must stay a safe integer (at most 2^53 - 1 = 9,007,199,254,740,991
  // pence, about £90 trillion), or the arithmetic stops being exact.
  it("accepts the largest amount that is exact", () => {
    expect(parsePounds("90,071,992,547,409.91")).toBe(Number.MAX_SAFE_INTEGER)
    expect(parsePounds("-90,071,992,547,409.91")).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it("rejects one penny more than the largest exact amount", () => {
    expect(parsePounds("90,071,992,547,409.92")).toBeNull()
    expect(parsePounds("99999999999999999999")).toBeNull()
  })
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
      expect(parsePounds(formatPence(pence))).toBe(pence)
    }
  })
})

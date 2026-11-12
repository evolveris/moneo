import { describe, expect, it } from "vitest"
import { DEFAULT_LIMITS } from "@/config/limits"
import { getLimits } from "./limits"

describe("DEFAULT_LIMITS", () => {
  it("match the SPEC", () => {
    expect(DEFAULT_LIMITS).toEqual({
      noteMaxLength: 200,
      undoWindowMs: 10_000,
      maxFileSizeBytes: 5 * 1024 * 1024,
      maxPdfPages: 10,
      maxRows: 5_000,
      aiUploadsPerHour: 5,
    })
  })
})

// Visitor IDs come from the visitor cookie. These two are made-up examples:
// one has an override in USER_LIMIT_OVERRIDES, the other does not.
const visitorWithOverride = "visitor-with-override"
const otherVisitor = "other-visitor"

describe("getLimits", () => {
  it("returns the defaults with no overrides", () => {
    expect(getLimits(visitorWithOverride, {})).toEqual(DEFAULT_LIMITS)
    expect(
      getLimits(visitorWithOverride, { USER_LIMIT_OVERRIDES: "" }),
    ).toEqual(DEFAULT_LIMITS)
  })

  it("overrides one field for one visitor only", () => {
    const env = {
      USER_LIMIT_OVERRIDES: JSON.stringify({
        [visitorWithOverride]: { aiUploadsPerHour: 50 },
      }),
    }
    expect(getLimits(visitorWithOverride, env)).toEqual({
      ...DEFAULT_LIMITS,
      aiUploadsPerHour: 50,
    })
    expect(getLimits(otherVisitor, env)).toEqual(DEFAULT_LIMITS)
  })

  it("does not read inherited object keys as visitors", () => {
    const env = { USER_LIMIT_OVERRIDES: "{}" }
    expect(getLimits("constructor", env)).toEqual(DEFAULT_LIMITS)
  })

  it("throws on malformed JSON without echoing it", () => {
    const run = () =>
      getLimits(visitorWithOverride, { USER_LIMIT_OVERRIDES: "{secret" })
    expect(run).toThrow("USER_LIMIT_OVERRIDES")
    expect(run).not.toThrow("secret")
  })

  it.each([
    '{"visitor-a":{"maxRows":"100"}}',
    '{"visitor-a":{"maxRows":1.5}}',
    '{"visitor-a":{"maxRows":0}}',
    '{"visitor-a":{"unknown":1}}',
    "[]",
    '{"visitor-a":5}',
  ])("throws on %s", (overridesJson) => {
    expect(() =>
      getLimits("visitor-a", { USER_LIMIT_OVERRIDES: overridesJson }),
    ).toThrow("USER_LIMIT_OVERRIDES")
  })
})

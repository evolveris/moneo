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

describe("getLimits", () => {
  it("returns the defaults with no overrides", () => {
    expect(getLimits("v1", {})).toEqual(DEFAULT_LIMITS)
    expect(getLimits("v1", { USER_LIMIT_OVERRIDES: "" })).toEqual(
      DEFAULT_LIMITS,
    )
  })

  it("overrides one field for one visitor only", () => {
    const env = {
      USER_LIMIT_OVERRIDES: JSON.stringify({ v1: { aiUploadsPerHour: 50 } }),
    }
    expect(getLimits("v1", env)).toEqual({
      ...DEFAULT_LIMITS,
      aiUploadsPerHour: 50,
    })
    expect(getLimits("v2", env)).toEqual(DEFAULT_LIMITS)
  })

  it("does not read inherited object keys as visitors", () => {
    const env = { USER_LIMIT_OVERRIDES: "{}" }
    expect(getLimits("constructor", env)).toEqual(DEFAULT_LIMITS)
  })

  it("throws on malformed JSON without echoing it", () => {
    const run = () => getLimits("v1", { USER_LIMIT_OVERRIDES: "{secret" })
    expect(run).toThrow("USER_LIMIT_OVERRIDES")
    expect(run).not.toThrow("secret")
  })

  it.each([
    '{"v1":{"maxRows":"100"}}',
    '{"v1":{"maxRows":1.5}}',
    '{"v1":{"maxRows":0}}',
    '{"v1":{"unknown":1}}',
    "[]",
    '{"v1":5}',
  ])("throws on %s", (raw) => {
    expect(() => getLimits("v1", { USER_LIMIT_OVERRIDES: raw })).toThrow(
      "USER_LIMIT_OVERRIDES",
    )
  })
})

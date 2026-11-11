import { describe, expect, it } from "vitest"
import { getMode } from "./mode"

describe("getMode", () => {
  it.each(["demo", "user"])("reads %s", (value) => {
    expect(getMode({ USER_MODE: value })).toBe(value)
  })

  it.each([undefined, "", "USER", "admin", " user"])(
    "falls back to demo for %j",
    (value) => {
      expect(getMode({ USER_MODE: value })).toBe("demo")
    },
  )
})

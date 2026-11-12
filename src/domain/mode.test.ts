import { describe, expect, it } from "vitest"
import { getUserMode } from "./mode"

describe("getUserMode", () => {
  it.each(["demo", "user"])("reads %s", (value) => {
    expect(getUserMode({ USER_MODE: value })).toBe(value)
  })

  it.each([undefined, "", "USER", "admin", " user"])(
    "falls back to demo for %j",
    (value) => {
      expect(getUserMode({ USER_MODE: value })).toBe("demo")
    },
  )
})

import { describe, expect, it } from "vitest"
import {
  CATEGORIES,
  CategorySchema,
  MOODS,
  MOTIVATIONS,
  MoodSchema,
  OUTCOMES,
  OutcomeSchema,
  MotivationSchema,
} from "./lists"

describe("fixed lists", () => {
  it("have the sizes in the SPEC", () => {
    expect(CATEGORIES).toHaveLength(11)
    expect(MOODS).toHaveLength(8)
    expect(MOTIVATIONS).toHaveLength(9)
    expect(OUTCOMES).toHaveLength(6)
  })

  it("keep the SPEC order", () => {
    expect(CATEGORIES[0]).toBe("Groceries")
    expect(CATEGORIES.slice(-2)).toEqual(["Income", "Transfers"])
    expect(MOODS[0]).toBe("happy")
    expect(MOTIVATIONS[8]).toBe("unwell")
    expect(OUTCOMES[0]).toBe("glad I bought it")
  })

  it("have no duplicates", () => {
    for (const list of [CATEGORIES, MOODS, MOTIVATIONS, OUTCOMES]) {
      expect(new Set(list).size).toBe(list.length)
    }
  })

  it("are enforced by the schemas", () => {
    expect(CategorySchema.safeParse("Holidays").success).toBe(false)
    expect(CategorySchema.safeParse("groceries").success).toBe(false)
    expect(MoodSchema.safeParse("angry").success).toBe(false)
    expect(MotivationSchema.safeParse("boredom").success).toBe(false)
    expect(OutcomeSchema.safeParse("glad I bought it").success).toBe(true)
  })
})

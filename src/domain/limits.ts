import { z } from "zod"
import { DEFAULT_LIMITS, type Limits } from "@/config/limits"

const limitValue = z.number().int().positive()

const overridesSchema = z.record(
  z.string(),
  z
    .strictObject({
      noteMaxLength: limitValue,
      undoWindowMs: limitValue,
      maxFileSizeBytes: limitValue,
      maxPdfPages: limitValue,
      maxRows: limitValue,
      aiUploadsPerHour: limitValue,
    })
    .partial(),
)

function readOverrides(env: Record<string, string | undefined>) {
  const overridesJson = env.USER_LIMIT_OVERRIDES
  if (!overridesJson) return {}
  let json: unknown
  try {
    json = JSON.parse(overridesJson)
  } catch {
    throw new Error("USER_LIMIT_OVERRIDES is not valid JSON.")
  }
  const result = overridesSchema.safeParse(json)
  if (!result.success) {
    // Names the problem but never echoes the value.
    throw new Error(
      "USER_LIMIT_OVERRIDES must be an object of visitor IDs to limits, each a positive whole number.",
    )
  }
  return result.data
}

// The single way to ask for limits. Defaults, plus the override for this
// visitor only. The source of overrides can change later (ADR-001 decision 16).
export function getLimits(
  visitorId: string,
  env: Record<string, string | undefined> = process.env,
): Limits {
  const overrides = readOverrides(env)
  const own = Object.hasOwn(overrides, visitorId) ? overrides[visitorId] : {}
  return { ...DEFAULT_LIMITS, ...own }
}
